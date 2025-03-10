document.addEventListener("DOMContentLoaded", () => {
    const exampleContent = {
        productName: "示範商品名稱",
        productIntro: "這是一個示範的商品簡介。",
        productDesc: "這是一個更詳細的商品描述，它描述了產品的特性和用途。"
    };

    // 生成按鈕點擊事件
    document.querySelectorAll(".generate").forEach(button => {
        button.addEventListener("click", (event) => {
            const targetId = event.target.getAttribute("data-target");
            document.getElementById(targetId).value = exampleContent[targetId];
        });
    });

    // 寫入按鈕點擊事件（這裡先簡單 console.log 顯示結果）
    document.querySelectorAll(".write").forEach(button => {
        button.addEventListener("click", (event) => {
            const targetId = event.target.getAttribute("data-target");
            const value = document.getElementById(targetId).value;
            console.log(`寫入欄位 ${targetId}:`, value);
        });
    });
});
