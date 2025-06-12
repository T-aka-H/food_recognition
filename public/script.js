console.log('Script loaded successfully!');

let selectedMenu = '';
let uploadedImageData = '';

// APIキーを環境変数から取得
async function getApiKey() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        console.log('API Key status:', data.geminiApiKey ? 'OK' : 'NOT SET');
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
        console.log('File input listener added');
    }
    
    // アップロードエリアのクリック処理（モバイル対応強化）
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        // クリックイベント
        uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Upload area clicked');
            fileInput.click();
        });
        
        // タッチイベント（モバイル対応）
        uploadArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            console.log('Upload area touched');
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

// ファイルアップロード処理（モバイル対応強化）
function handleFileUpload(e) {
    console.log('File upload triggered');
    const file = e.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    console.log('File selected:', file.name, file.size, file.type);
    
    // ファイルサイズチェック
    if (file.size > 10 * 1024 * 1024) {
        showError('ファイルサイズが大きすぎます（10MB以下にしてください）');
        return;
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
        showError('画像ファイルを選択してください');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedImageData = e.target.result;
        console.log('Image data loaded, size:', uploadedImageData.length);
        
        // プレビュー表示
        const img = document.getElementById('uploadedImage');
        if (img) {
            img.src = uploadedImageData;
            img.style.display = 'block';
            console.log('Image preview displayed');
        }
        
        // 画像認識実行
        recognizeFood();
    };
    
    reader.onerror = function(error) {
        console.error('FileReader error:', error);
        showError('ファイル読み込みエラーが発生しました');
    };
    
    reader.readAsDataURL(file);
}

// 画像認識機能
async function recognizeFood() {
    console.log('Starting food recognition');
    const apiKey = await getApiKey();
    if (!apiKey || apiKey === 'NOT_SET') {
        showError('APIキーが設定されていません');
        return;
    }

    showLoading(true);
    hideError();

    try {
        const base64Data = uploadedImageData.split(',')[1];
        console.log('Sending request to Gemini API...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: "この画像の料理を分析して、可能性の高い料理名を5つ、日本語で簡潔に答えてください。回答は料理名のみをカンマ区切りで返してください。例：ハンバーガー,チーズバーガー,テリヤキバーガー,チキンバーガー,フィッシュバーガー"
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Gemini API response:', data);
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const suggestions = data.candidates[0].content.parts[0].text.split(',').map(s => s.trim());
            displayMenuSuggestions(suggestions);
        } else {
            console.error('Unexpected API response structure:', data);
            // フォールバック：テスト用メニューを表示
            displayMenuSuggestions(['ハンバーガー', 'ラーメン', 'カレー', 'パスタ', 'サラダ']);
        }
    } catch (error) {
        console.error('Recognition error:', error);
        showError('画像認識でエラーが発生しました: ' + error.message);
        // フォールバック：テスト用メニューを表示
        displayMenuSuggestions(['ハンバーガー', 'ラーメン', 'カレー', 'パスタ', 'サラダ']);
    } finally {
        showLoading(false);
    }
}

// メニュー候補表示
function displayMenuSuggestions(suggestions) {
    console.log('Displaying menu suggestions:', suggestions);
    const menuGrid = document.getElementById('menuGrid');
    const menuSuggestions = document.getElementById('menuSuggestions');
    
    if (menuGrid && menuSuggestions) {
        menuGrid.innerHTML = '';
        
        suggestions.forEach(menu => {
            const button = document.createElement('button');
            button.className = 'menu-option';
            button.textContent = menu;
            button.onclick = () => selectMenu(menu, button);
            menuGrid.appendChild(button);
        });
        
        menuSuggestions.style.display = 'block';
        console.log('Menu suggestions displayed');
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

// 分析ボタン処理（修正版）
async function handleAnalyze() {
    console.log('Analyze button clicked');
    const menu = selectedMenu || document.getElementById('customMenu').value;
    if (!menu) {
        showError('料理を選択するか入力してください');
        return;
    }
    
    console.log('Starting analysis for menu:', menu);
    const apiKey = await getApiKey();
    if (!apiKey || apiKey === 'NOT_SET') {
        showError('APIキーが設定されていません');
        return;
    }

    await analyzeNutrition(menu, apiKey);
}

// 栄養分析機能（完全実装版）
async function analyzeNutrition(menuName, apiKey) {
    console.log('Starting nutrition analysis for:', menuName);
    showLoading(true);
    hideError();
    const results = document.getElementById('results');
    if (results) {
        results.style.display = 'none';
    }

    try {
        console.log('Sending nutrition analysis request...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${menuName}の栄養面での特徴を詳しく分析してください。以下の項目について説明してください：

1. 主要栄養素（炭水化物、タンパク質、脂質）の含有量と特徴
2. ビタミン・ミネラルの特徴
3. カロリー（概算）
4. 健康面でのメリット
5. 注意すべき点（もしあれば）
6. 栄養バランスを改善するための提案

日本語で、わかりやすく詳細に回答してください。`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Nutrition analysis response:', data);
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const analysis = data.candidates[0].content.parts[0].text;
            displayResults(menuName, analysis);
        } else {
            throw new Error('栄養分析に失敗しました - APIレスポンスが不正です');
        }
    } catch (error) {
        console.error('Analysis error:', error);
        showError('栄養分析でエラーが発生しました: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// 結果表示
function displayResults(menuName, analysis) {
    console.log('Displaying results for:', menuName);
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <h3>📊 「${menuName}」の栄養分析結果</h3>
            <div class="nutrition-info">
                ${analysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
            </div>
        `;
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

// ローディング表示制御
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// エラー表示
function showError(message) {
    console.error('Error:', message);
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
    alert(message); // モバイルでも確実に見えるように
}

// エラー非表示
function hideError() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}