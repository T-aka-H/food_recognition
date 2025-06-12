const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('=== サーバー設定開始 ===');
console.log('__dirname:', __dirname);
console.log('public path:', path.join(__dirname, 'public'));

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 静的ファイル配信 - より明示的な設定
const publicPath = path.join(__dirname, 'public');
console.log('Static files serving from:', publicPath);

app.use(express.static(publicPath, {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['htm', 'html', 'css', 'js'],
    index: false,
    maxAge: '1d',
    redirect: false,
    setHeaders: function (res, filePath, stat) {
        console.log('Serving static file:', filePath);
        
        // MIME タイプを明示的に設定
        if (filePath.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        } else if (filePath.endsWith('.html')) {
            res.set('Content-Type', 'text/html');
        }
        
        res.set('x-timestamp', Date.now());
    }
}));

// 個別ファイルルート（デバッグ用）
app.get('/script.js', (req, res) => {
    const scriptPath = path.join(__dirname, 'public', 'script.js');
    console.log('Script.js requested, serving from:', scriptPath);
    res.set('Content-Type', 'application/javascript');
    res.sendFile(scriptPath, (err) => {
        if (err) {
            console.error('Error serving script.js:', err);
            res.status(404).send('Script not found');
        } else {
            console.log('Script.js served successfully');
        }
    });
});

app.get('/style.css', (req, res) => {
    const stylePath = path.join(__dirname, 'public', 'style.css');
    console.log('Style.css requested, serving from:', stylePath);
    res.set('Content-Type', 'text/css');
    res.sendFile(stylePath, (err) => {
        if (err) {
            console.error('Error serving style.css:', err);
            res.status(404).send('Style not found');
        } else {
            console.log('Style.css served successfully');
        }
    });
});

// APIキー提供エンドポイント
app.get('/api/config', (req, res) => {
    console.log('API config requested');
    res.json({
        geminiApiKey: process.env.GEMINI_API_KEY || 'NOT_SET'
    });
});

// ルートパス - index.htmlを明示的に送信
app.get('/', (req, res) => {
    console.log('Root path accessed');
    const indexPath = path.join(__dirname, 'public', 'index.html');
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading page');
        } else {
            console.log('Index.html served successfully');
        }
    });
});

// ヘルスチェック
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        publicPath: publicPath
    });
});



// 404ハンドラー
app.use('*', (req, res) => {
    console.log('404 - Route not found:', req.originalUrl);
    res.status(404).json({ 
        error: 'Route not found', 
        path: req.originalUrl,
        availableFiles: ['/', '/script.js', '/style.css', '/api/config', '/health', '/debug/files']
    });
});

// エラーハンドラー
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=== サーバー起動完了 ===`);
    console.log(`ポート: ${PORT}`);
    console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`静的ファイルディレクトリ: ${publicPath}`);
    console.log(`APIキー設定: ${process.env.GEMINI_API_KEY ? '✅' : '❌'}`);
    
    // ファイル存在確認
    const fs = require('fs');
    console.log('=== ファイル存在確認 ===');
    console.log(`index.html: ${fs.existsSync(path.join(publicPath, 'index.html')) ? '✅' : '❌'}`);
    console.log(`script.js: ${fs.existsSync(path.join(publicPath, 'script.js')) ? '✅' : '❌'}`);
    console.log(`style.css: ${fs.existsSync(path.join(publicPath, 'style.css')) ? '✅' : '❌'}`);
    console.log(`========================`);
});