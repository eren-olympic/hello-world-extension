// Function to inject content script
async function injectContentScript() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  // Inject content script first
  await injectContentScript();
  
  // Get current platform
  const platformSelect = document.getElementById('platform');
  const fillButton = document.getElementById('fillButton');
  const ewebsButtons = document.getElementById('ewebsButtons');
  const shopeeButtons = document.getElementById('shopeeButtons');

  // Handle platform change
  platformSelect.addEventListener('change', function() {
    if (this.value === 'shopee') {
      ewebsButtons.style.display = 'none';
      shopeeButtons.style.display = 'block';
    } else {
      ewebsButtons.style.display = 'block';
      shopeeButtons.style.display = 'none';
    }
  });
  const generalStatus = document.getElementById('generalStatus');
  const productStatus = document.getElementById('productStatus');
  const listFieldsButton = document.getElementById('listFieldsButton');
  const fieldsList = document.getElementById('fieldsList');
  const applyCustomFields = document.getElementById('applyCustomFields');
  const customFieldStatus = document.getElementById('customFieldStatus');
  
  // General input filling
  fillButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "fillInputs",
        platform: platformSelect.value
      }, function(response) {
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
          fieldId: fieldId,
          platform: platformSelect.value
        }, function(response) {
          if(response && response.status === "completed") {
            productStatus.textContent = `已填入${button.textContent.replace('填入', '').replace('範例', '').replace(' (Shopee)', '').replace(' (Ewebs)', '')}。`;
          } else {
            productStatus.textContent = `錯誤：找不到指定的欄位 (${fieldId})`;
          }
        });
      });
    });
  });

  // List all fields button
  listFieldsButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "getFields",
        platform: platformSelect.value
      }, function(response) {
        if(response && response.status === "completed") {
          // Clear previous content
          fieldsList.innerHTML = '';
          
          // Create table for fields
          const table = document.createElement('table');
          table.style.width = '100%';
          table.style.marginBottom = '10px';
          
          // Add fields to table
          response.fields.forEach(field => {
            const row = document.createElement('tr');
            
            // Field name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = field.name;
            nameCell.style.padding = '5px';
            row.appendChild(nameCell);
            
            // Input cell
            const inputCell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = field.value;
            input.setAttribute('data-field-name', field.name);
            input.style.width = '100%';
            input.style.padding = '2px';
            inputCell.appendChild(input);
            row.appendChild(inputCell);
            
            table.appendChild(row);
          });
          
          fieldsList.appendChild(table);
          applyCustomFields.style.display = 'block';
        } else {
          fieldsList.innerHTML = '錯誤：無法取得欄位列表。';
        }
      });
    });
  });

  // Apply custom fields button
  applyCustomFields.addEventListener('click', function() {
    const inputs = fieldsList.querySelectorAll('input');
    const fields = Array.from(inputs).map(input => ({
      name: input.getAttribute('data-field-name'),
      value: input.value
    }));

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "fillCustomFields",
        fields: fields,
        platform: platformSelect.value
      }, function(response) {
        if(response && response.status === "completed") {
          customFieldStatus.textContent = `已填入 ${response.count} 個欄位。`;
        } else {
          customFieldStatus.textContent = '錯誤：無法填入欄位。';
        }
      });
    });
  });
});
