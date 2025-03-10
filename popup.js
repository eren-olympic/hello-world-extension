document.addEventListener('DOMContentLoaded', function() {
  const fillButton = document.getElementById('fillButton');
  const generalStatus = document.getElementById('generalStatus');
  const productStatus = document.getElementById('productStatus');
  
  // General input filling
  fillButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "fillInputs"}, function(response) {
        if(response) {
          generalStatus.textContent = `完成！找到 ${response.count} 個輸入欄位。`;
        } else {
          generalStatus.textContent = "錯誤：無法與頁面通訊。";
        }
      });
    });
  });

  // Product example content filling
  document.querySelectorAll('.product-button').forEach(button => {
    button.addEventListener('click', function() {
      const fieldId = this.getAttribute('data-field');
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "fillExample",
          fieldId: fieldId
        }, function(response) {
          if(response && response.status === "completed") {
            productStatus.textContent = `已填入${button.textContent.replace('填入', '').replace('範例', '')}。`;
          } else {
            productStatus.textContent = `錯誤：找不到指定的欄位 (${fieldId})`;
          }
        });
      });
    });
  });
});
