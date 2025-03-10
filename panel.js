// Function to inject content script
async function injectContentScript() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  try {
    await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    });
  } catch (error) {
    console.error('Failed to inject content script:', error);
  }
}

// Function to ensure content script is injected
async function ensureContentScript() {
  await injectContentScript();
}

document.addEventListener('DOMContentLoaded', async function() {
  const fillButton = document.getElementById('fillButton');
  const generalStatus = document.getElementById('generalStatus');
  const productStatus = document.getElementById('productStatus');
  const listFieldsButton = document.getElementById('listFieldsButton');
  const fieldsList = document.getElementById('fieldsList');
  const applyCustomFields = document.getElementById('applyCustomFields');
  const customFieldStatus = document.getElementById('customFieldStatus');
  
  // Ensure content script is injected when panel opens
  await ensureContentScript();

  // General input filling
  fillButton.addEventListener('click', async function() {
    await ensureContentScript();
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    chrome.tabs.sendMessage(tab.id, {action: "fillInputs"}, function(response) {
      if(response) {
        generalStatus.textContent = `完成！找到 ${response.count} 個輸入欄位。`;
      } else {
        generalStatus.textContent = "錯誤：無法與頁面通訊。";
      }
    });
  });

  // Product example content filling
  document.querySelectorAll('.product-button').forEach(button => {
    button.addEventListener('click', async function() {
      await ensureContentScript();
      const fieldId = this.getAttribute('data-field');
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      chrome.tabs.sendMessage(tab.id, {
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

  // List all fields button
  listFieldsButton.addEventListener('click', async function() {
    await ensureContentScript();
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    chrome.tabs.sendMessage(tab.id, {action: "getFields"}, function(response) {
      if(response && response.status === "completed") {
        // Clear previous content
        fieldsList.innerHTML = '';
        
        // Create table for fields
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.marginBottom = '10px';
        
        // Add fields to table
        response.fields.forEach(field => {
          // Main row for field name and input
          const mainRow = document.createElement('tr');
          mainRow.style.borderBottom = '1px solid #eee';
          
          // Field name cell with type info
          const nameCell = document.createElement('td');
          const nameDiv = document.createElement('div');
          nameDiv.textContent = field.displayName;
          nameDiv.style.fontWeight = 'bold';
          
          const idDiv = document.createElement('div');
          idDiv.textContent = field.name;
          idDiv.style.fontSize = '11px';
          idDiv.style.color = '#999';
          idDiv.style.fontFamily = 'monospace';
          
          const typeDiv = document.createElement('div');
          typeDiv.textContent = `${field.elementType}${field.inputType !== 'text' ? ` (${field.inputType})` : ''}`;
          typeDiv.style.fontSize = '12px';
          typeDiv.style.color = '#666';
          
          nameCell.appendChild(nameDiv);
          nameCell.appendChild(idDiv);
          nameCell.appendChild(typeDiv);
          nameCell.style.padding = '5px';
          mainRow.appendChild(nameCell);
          
          // Input cell
          const inputCell = document.createElement('td');
          let input;
          
          if (field.elementType === 'select' && field.constraints.options) {
            input = document.createElement('select');
            field.constraints.options.forEach(opt => {
              const option = document.createElement('option');
              option.value = opt.value;
              option.textContent = opt.text;
              option.selected = opt.selected;
              input.appendChild(option);
            });
          } else {
            input = document.createElement('input');
            input.type = field.inputType;
            input.value = field.value;
            
            // Apply constraints to input
            if (field.constraints.maxLength) input.maxLength = field.constraints.maxLength;
            if (field.constraints.minLength) input.minLength = field.constraints.minLength;
            if (field.constraints.max) input.max = field.constraints.max;
            if (field.constraints.min) input.min = field.constraints.min;
            if (field.constraints.pattern) input.pattern = field.constraints.pattern;
            if (field.constraints.required) input.required = true;
            if (field.constraints.step) input.step = field.constraints.step;
            if (field.inputType === 'file' && field.constraints.accept) input.accept = field.constraints.accept;
            if (field.constraints.multiple) input.multiple = true;
          }
          
          input.setAttribute('data-field-name', field.name);
          input.style.width = '100%';
          input.style.padding = '2px';
          inputCell.appendChild(input);
          mainRow.appendChild(inputCell);
          
          table.appendChild(mainRow);
          
          // Add constraints info row if any constraints exist
          const constraints = Object.entries(field.constraints).filter(([key]) => key !== 'options');
          if (constraints.length > 0 || field.isRichText) {
            const infoRow = document.createElement('tr');
            const infoCell = document.createElement('td');
            infoCell.colSpan = 2;
            infoCell.style.padding = '2px 5px 8px 5px';
            infoCell.style.fontSize = '12px';
            infoCell.style.color = '#666';
            
            let infoText = [];
            if (field.isRichText) infoText.push('富文本編輯器');
            
            constraints.forEach(([key, value]) => {
              if (value === true) {
                infoText.push(key);
              } else {
                infoText.push(`${key}: ${value}`);
              }
            });
            
            infoCell.textContent = infoText.join(' | ');
            infoRow.appendChild(infoCell);
            table.appendChild(infoRow);
          }
        });
        
        fieldsList.appendChild(table);
        applyCustomFields.style.display = 'block';
      } else {
        fieldsList.innerHTML = '錯誤：無法取得欄位列表。';
      }
    });
  });

  // Apply custom fields button
  applyCustomFields.addEventListener('click', async function() {
    await ensureContentScript();
    const inputs = fieldsList.querySelectorAll('input');
    const fields = Array.from(inputs).map(input => ({
      name: input.getAttribute('data-field-name'),
      value: input.value
    }));

    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    chrome.tabs.sendMessage(tab.id, {
      action: "fillCustomFields",
      fields: fields
    }, function(response) {
      if(response && response.status === "completed") {
        customFieldStatus.textContent = `已填入 ${response.count} 個欄位。`;
      } else {
        customFieldStatus.textContent = '錯誤：無法填入欄位。';
      }
    });
  });
});

// Listen for side panel visibility changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "panelShown") {
    ensureContentScript();
  }
});
