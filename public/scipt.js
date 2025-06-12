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

// ファイルアップロード処理
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImageData = e.target.result;
            const img = document.getElementById('uploadedImage');
            img.src = uploadedImageData;
            img.style.display = 'block';
            
            // 画像認識を実行
            recognizeFood();
        };
        reader.readAsDataURL(file);
    }
});

// 食事認識機能
async function recognizeFood() {
    const apiKey = await getApiKey();
    if (!apiKey) {
        showError('APIキーが設定されていません');
        return;
    }

    showLoading(true);
    hideError();

    try {
        const base64Data = uploadedImageData.split(',')[1];
        
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

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]) {
            const suggestions = data.candidates[0].content.parts[0].text.split(',').map(s => s.trim());
            displayMenuSuggestions(suggestions);
        } else {
            throw new Error('画像認識に失敗しました');
        }
    } catch (error) {
        showError('画像認識でエラーが発生しました: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// メニュー候補表示
function displayMenuSuggestions(suggestions) {
    const menuGrid = document.getElementById('menuGrid');
    const menuSuggestions = document.getElementById('menuSuggestions');
    
    menuGrid.innerHTML = '';
    
    suggestions.forEach(menu => {
        const button = document.createElement('button');
        button.className = 'menu-option';
        button.textContent = menu;
        button.onclick = () => selectMenu(menu, button);
        menuGrid.appendChild(button);
    });
    
    menuSuggestions.style.display = 'block';
}

// メニュー選択
function selectMenu(menu, button) {
    // 既存の選択を解除
    document.querySelectorAll('.menu-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 新しい選択を設定
    button.classList.add('selected');
    selectedMenu = menu;
    document.getElementById('customMenu').value = menu;
}

// カスタム入力監視
document.getElementById('customMenu').addEventListener('input', function(e) {
    selectedMenu = e.target.value;
    
    // ボタンの選択を解除
    document.querySelectorAll('.menu-option').forEach(btn => {
        btn.classList.remove('selected');
    });
});

// 栄養分析実行
document.getElementById('analyzeBtn').addEventListener('click', async function() {
    const menu = selectedMenu || document.getElementById('customMenu').value;
    if (!menu) {
        showError('料理を選択するか入力してください');
        return;
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
        showError('APIキーが設定されていません');
        return;
    }

    await analyzeNutrition(menu, apiKey);
});

// 栄養分析機能
async function analyzeNutrition(menuName, apiKey) {
    showLoading(true);
    hideError();
    document.getElementById('results').style.display = 'none';

    try {
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

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]) {
            const analysis = data.candidates[0].content.parts[0].text;
            displayResults(menuName, analysis);
        } else {
            throw new Error('栄養分析に失敗しました');
        }
    } catch (error) {
        showError('栄養分析でエラーが発生しました: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// 結果表示
function displayResults(menuName, analysis) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h3>📊 「${menuName}」の栄養分析結果</h3>
        <div class="nutrition-info">
            ${analysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
        </div>
    `;
    resultsDiv.style.display = 'block';
    
    // 結果までスクロール
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// ローディング表示制御
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// エラー表示
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// エラー非表示
function hideError() {
    document.getElementById('error').style.display = 'none';
}

// ドラッグ&ドロップ対応
const uploadArea = document.querySelector('.upload-area');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#2980b9';
    uploadArea.style.backgroundColor = 'rgba(44, 62, 80, 0.1)';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#3498db';
    uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#3498db';
    uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('fileInput').files = files;
        document.getElementById('fileInput').dispatchEvent(new Event('change'));
    }
});