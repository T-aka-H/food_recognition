console.log('Script loaded successfully!');

let selectedMenu = '';
let uploadedImageData = '';

// APIキーを環境変数から取得
async function getApiKey() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        return data.geminiApiKey;
    } catch (error) {
        console.error('APIキーの取得に失敗:', error);
        return null;
    }
}

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // ファイルアップロード処理
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    // アップロードエリアのクリック処理
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // 分析ボタン
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyze);
    }
    
    // カスタム入力
    const customMenu = document.getElementById('customMenu');
    if (customMenu) {
        customMenu.addEventListener('input', (e) => {
            selectedMenu = e.target.value;
        });
    }
});

// ファイルアップロード処理
function handleFileUpload(e) {
    console.log('File upload triggered');
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedImageData = e.target.result;
        
        // プレビュー表示
        const img = document.getElementById('uploadedImage');
        if (img) {
            img.src = uploadedImageData;
            img.style.display = 'block';
        }
        
        // テスト用：簡単なメニュー表示
        showTestMenu();
    };
    reader.readAsDataURL(file);
}

// テスト用メニュー表示
function showTestMenu() {
    console.log('Showing test menu');
    const menuSuggestions = document.getElementById('menuSuggestions');
    const menuGrid = document.getElementById('menuGrid');
    
    if (menuGrid && menuSuggestions) {
        menuGrid.innerHTML = '';
        
        const testMenus = ['ハンバーガー', 'ラーメン', 'カレー', 'パスタ', 'サラダ'];
        
        testMenus.forEach(menu => {
            const button = document.createElement('button');
            button.className = 'menu-option';
            button.textContent = menu;
            button.onclick = () => selectMenu(menu, button);
            menuGrid.appendChild(button);
        });
        
        menuSuggestions.style.display = 'block';
    }
}

// メニュー選択
function selectMenu(menu, button) {
    console.log('Menu selected:', menu);
    document.querySelectorAll('.menu-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    button.classList.add('selected');
    selectedMenu = menu;
    
    const customMenu = document.getElementById('customMenu');
    if (customMenu) {
        customMenu.value = menu;
    }
}

// 分析ボタン処理
async function handleAnalyze() {
    const menu = selectedMenu || document.getElementById('customMenu').value;
    if (!menu) {
        alert('料理を選択してください');
        return;
    }
    
    alert(`「${menu}」の栄養分析機能は準備中です`);
}