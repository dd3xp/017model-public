# Text2CAD
## 安装与运行
1. 克隆项目：
   ```bash
   git clone <repository-url>
   cd text2cad
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   在项目根目录创建 `.env` 文件，并添加以下内容：
   ```
   JWT_SECRET=your-secret-key
   DB_HOST=localhost
   DB_USER=your-db-user
   DB_PASS=your-db-password
   DB_NAME=your-db-name
   ```

4. 运行开发服务器：
   ```bash
   npm run dev
   ```

5. 构建生产版本：
   ```bash
   npm run build
   npm start
   ```