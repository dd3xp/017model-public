import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '@/styles/Create.module.css';
import TopBar from '@/components/TopBar';
import { jwtDecode } from 'jwt-decode';
import * as THREE from 'three';
// @ts-expect-error: STLLoader is not typed in three/examples
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
// @ts-expect-error: OrbitControls is not typed in three/examples
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function CreateWork() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [workId, setWorkId] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const decoded = jwtDecode<{ id: number; email: string }>(token);
      setUserEmail(decoded.email);
      setUserId(decoded.id);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchCurrentWork = async () => {
      try {
        const response = await fetch(`/api/works/current?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setWorkId(data.id);
          setDescription(data.description);
        }
      } catch (error) {
        console.error('Failed to fetch current work:', error);
      }
    };

    fetchCurrentWork();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCreateWork = () => {
    router.push('/create');
  };

  const handleViewWork = () => {
    router.push('/works');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert(t('create.validation.required'));
      return;
    }
    if (!userId) {
      router.replace('/login');
      return;
    }
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    try {
      const response = await fetch('/api/works/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, description }),
        signal: abortControllerRef.current.signal
      });
      if (response.ok) {
        const data = await response.json();
        setWorkId(data.id);
        alert(t('create.submit.success'));
      } else {
        alert(t('create.submit.failed'));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        alert(t('create.submit.failed'));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleAdjust = async () => {
    if (!workId || !userId) return;
    setIsAdjusting(true);
    abortControllerRef.current = new AbortController();
    try {
      const response = await fetch('/api/works/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          workId,
          description
        }),
        signal: abortControllerRef.current.signal
      });
      if (response.ok) {
        const data = await response.json();
        setWorkId(null);
        setTimeout(() => setWorkId(workId), 100);
        alert(t('create.adjust.success'));
      } else {
        alert(t('create.adjust.failed'));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        alert(t('create.adjust.failed'));
      }
    } finally {
      setIsAdjusting(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (!workId || !previewRef.current) return;
    const container = previewRef.current;
    container.innerHTML = '';
    const scene = new THREE.Scene();
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
    renderer.setClearColor('#f0f0f0');
    renderer.setSize(container.clientWidth, 575);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    const loader = new STLLoader();
    loader.load(`/api/works/stl?id=${workId}`, (geometry: THREE.BufferGeometry) => {
      const material = new THREE.MeshStandardMaterial({ color: 0x2194ce });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox?.getCenter(center);
      mesh.position.sub(center);
      animate();
    });
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    return () => {
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [workId]);

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
          <h2>{t('create.title')}</h2>
          <p className={styles.description}>{t('create.description')}</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('create.input.placeholder')}
                className={styles.textarea}
                rows={6}
                disabled={isGenerating || isAdjusting}
              />
            </div>
            <div className={styles.buttonGroup}>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isGenerating || isAdjusting}
              >
                {isGenerating ? t('create.submit.generating') : t('create.submit.default')}
              </button>
              {workId && (
                <button 
                  type="button"
                  onClick={handleAdjust}
                  className={styles.adjustButton}
                  disabled={isGenerating || isAdjusting}
                >
                  {isAdjusting ? t('create.adjust.adjusting') : t('create.adjust.default')}
                </button>
              )}
            </div>
          </form>
        </div>
        <div className={styles.preview} ref={previewRef} />
      </main>
    </div>
  );
}

export async function getStaticProps({ locale = 'zh' }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
} 