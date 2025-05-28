import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '@/styles/Works.module.css';
import TopBar from '@/components/TopBar';
import { jwtDecode } from 'jwt-decode';
import * as THREE from 'three';
// @ts-expect-error: STLLoader is not typed in three/examples
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
// @ts-expect-error: OrbitControls is not typed in three/examples
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface SavedWork {
  id: number;
  name: string;
  description: string;
  stlPath: string;
  createdAt: string;
}

export default function Works() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [works, setWorks] = useState<SavedWork[]>([]);
  const [selectedWork, setSelectedWork] = useState<SavedWork | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const decoded = jwtDecode<{ id: number; email: string }>(token);
      setUserEmail(decoded.email);
      fetchWorks(decoded.id);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const fetchWorks = async (userId: number) => {
    try {
      const response = await fetch(`/api/works/saved?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWorks(data);
      } else {
        console.error('Failed to fetch works:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch works:', error);
    }
  };

  const handleCreateWork = () => {
    router.push('/create');
  };

  const handleViewWork = () => {
    router.push('/works');
  };

  const cleanupScene = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }
  };

  const handleWorkClick = (work: SavedWork) => {
    if (selectedWork?.id === work.id) {
      cleanupScene();
      setSelectedWork(null);
    } else {
      setSelectedWork(work);
    }
  };

  const handleDelete = async (workId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('works.delete.confirm'))) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/works/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workId }),
      });
      
      if (response.ok) {
        if (selectedWork?.id === workId) {
          cleanupScene();
          setSelectedWork(null);
        }
        setWorks(works.filter(work => work.id !== workId));
        alert(t('works.delete.success'));
      } else {
        alert(t('works.delete.failed'));
      }
    } catch (error) {
      console.error('Failed to delete work:', error);
      alert(t('works.delete.failed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (stlPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/works/download?path=${encodeURIComponent(stlPath)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = stlPath.split(/[\\/]/).pop() || 'model.stl';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(t('works.download.failed'));
      }
    } catch (error) {
      console.error('Failed to download work:', error);
      alert(t('works.download.failed'));
    }
  };

  useEffect(() => {
    if (!previewRef.current) return;

    cleanupScene();

    if (!selectedWork) return;

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '575px';
    container.style.position = 'relative';
    previewRef.current.appendChild(container);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 2000);
    camera.position.set(200, 200, 200);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(400, 400, 400);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);
    const gridHelper = new THREE.GridHelper(1000, 100);
    scene.add(gridHelper);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setClearColor('#f0f0f0');
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;

    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cleanupScene();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [selectedWork]);

  useEffect(() => {
    if (!selectedWork || !sceneRef.current) return;

    const loader = new STLLoader();
    const stlPath = selectedWork.stlPath.replace(/\\/g, '/');
    loader.load(`/api/works/stl?path=${encodeURIComponent(stlPath)}`, (geometry: THREE.BufferGeometry) => {
      if (!sceneRef.current) return;
      const material = new THREE.MeshStandardMaterial({ color: 0x2194ce });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sceneRef.current.add(mesh);
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox?.getCenter(center);
      mesh.position.sub(center);
    });
  }, [selectedWork]);

  if (!userEmail) {
    return null;
  }

  return (
    <div className={styles.container}>
      <TopBar 
        username={userEmail}
        menuItems={[
          { label: t('dashboard.menu.newWork'), onClick: handleCreateWork },
          { label: t('dashboard.menu.myWork'), onClick: handleViewWork }
        ]}
      />
      <main className={styles.main}>
        <div className={styles.content}>
          <h2>{t('works.title')}</h2>
          <div className={styles.workList}>
            {works.map(work => (
              <div
                key={work.id}
                className={`${styles.workItem} ${selectedWork?.id === work.id ? styles.selected : ''}`}
                onClick={() => handleWorkClick(work)}
              >
                <div className={styles.workHeader}>
                  <h3>{work.name}</h3>
                  <div className={styles.buttonGroup}>
                    <button
                      className={styles.downloadButton}
                      onClick={(e) => handleDownload(work.stlPath, e)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                      </svg>
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => handleDelete(work.id, e)}
                      disabled={isDeleting}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p>{work.description}</p>
                <span className={styles.date}>
                  {new Date(work.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.preview} ref={previewRef}>
          {!selectedWork && (
            <div className={styles.noPreview}>
              {t('works.noPreview')}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps({ locale = 'zh' }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}