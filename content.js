const exampleContent = {
  'prod_name': "示範商品名稱",
  'prod_desc_1': "這是一個示範的商品簡介。這個商品具有優質的品質和精美的設計。適合各種場合使用，讓您愛不釋手。",
  'prod_desc_2': "<h2>商品特色</h2>\n<ul>\n<li>高品質材料，精心製作</li>\n<li>時尚美觀的設計</li>\n<li>耐用且實用</li>\n<li>多種用途</li>\n</ul>\n\n<h2>商品規格</h2>\n<ul>\n<li>尺寸：依照商品實際規格</li>\n<li>材質：優質材料</li>\n<li>產地：台灣</li>\n</ul>\n\n<h2>使用說明</h2>\n<ol>\n<li>拆封後請檢查商品是否完整</li>\n<li>依照說明書指示使用</li>\n<li>如有問題請聯繫客服</li>\n</ol>"
};

// Fill specific field with example content
function fillExampleContent(fieldName) {
  // Try to find element by name attribute first
  let element = document.querySelector(`[name="${fieldName}"]`);
  
  if (element) {
    const content = exampleContent[fieldName];
    if (content) {
      // Handle normal input fields
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = content;
      }
      
      // Handle rich text editor (summernote)
      const richEditor = element.nextElementSibling?.querySelector('.note-editable');
      if (richEditor) {
        richEditor.innerHTML = content;
      }

      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`寫入欄位 ${fieldName}:`, content);
      return true;
    }
  }
  return false;
}

// This function will find all input fields and fill them with "test" + index
function fillAllInputs() {
  // Get all writable elements
  const writableElements = document.querySelectorAll(
    'input[type="text"], ' +
    'input[type="email"], ' +
    'input[type="password"], ' +
    'input[type="search"], ' +
    'input[type="tel"], ' +
    'input[type="url"], ' +
    'input[type="number"], ' +
    'input:not([type]), ' +
    'textarea, ' +
    '[contenteditable="true"], ' +
    '[role="textbox"]'
  );
  
  let filledCount = 0;
  
  // Loop through each writable element and fill it
  writableElements.forEach((element, index) => {
    // Skip hidden inputs, readonly elements, and disabled elements
    if (element.type === 'hidden' || 
        element.readOnly || 
        element.disabled || 
        element.getAttribute('aria-readonly') === 'true') {
      return;
    }

    const testValue = `test${index + 1}`;

    if (element.isContentEditable || element.getAttribute('role') === 'textbox') {
      // Handle contenteditable elements
      element.textContent = testValue;
    } else {
      // Handle regular input elements and textareas
      element.value = testValue;
    }
    
    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);

    filledCount++;
  });
  
  console.log(`Filled ${filledCount} writable elements with test values`);
  return filledCount;
}

// Get all writable fields with their names and constraints
function getAllWritableFields() {
  const fields = [];
  const elements = document.querySelectorAll('input[name], textarea[name], [contenteditable][name], select[name]');
  
  elements.forEach(element => {
    // Skip hidden, readonly, and disabled elements
    if (element.type === 'hidden' || 
        element.readOnly || 
        element.disabled || 
        element.getAttribute('aria-readonly') === 'true') {
      return;
    }

    // Get field name and current value
    const name = element.getAttribute('name');
    let value = '';
    
    // Try to get a user-friendly display name
    let displayName = '';
    
    // 1. Check for label element
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        displayName = label.textContent.trim();
      }
    }
    
    // 2. Check for parent label if no explicit label found
    if (!displayName) {
      const parentLabel = element.closest('label');
      if (parentLabel) {
        // Get text content excluding the input's text
        const clone = parentLabel.cloneNode(true);
        const inputs = clone.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.remove());
        displayName = clone.textContent.trim();
      }
    }
    
    // 3. Check for aria-label
    if (!displayName) {
      displayName = element.getAttribute('aria-label');
    }
    
    // 4. Check for placeholder
    if (!displayName) {
      displayName = element.getAttribute('placeholder');
    }
    
    // 5. Check for title attribute
    if (!displayName) {
      displayName = element.getAttribute('title');
    }
    
    // 6. Try to find a preceding text node or element that might be a label
    if (!displayName) {
      let previousElement = element.previousElementSibling;
      while (previousElement && !displayName) {
        if (previousElement.tagName === 'LABEL' || 
            previousElement.tagName === 'SPAN' || 
            previousElement.tagName === 'DIV') {
          displayName = previousElement.textContent.trim();
          break;
        }
        previousElement = previousElement.previousElementSibling;
      }
    }
    
    // 7. Try to make the name attribute more readable if no other name found
    if (!displayName && name) {
      displayName = name
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/[_-]/g, ' ')      // Replace underscores and hyphens with spaces
        .replace(/\s+/g, ' ')       // Replace multiple spaces with single space
        .trim()
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
    }
    
    let fieldInfo = {
      name: name,
      displayName: displayName || name,
      value: value,
      elementType: element.tagName.toLowerCase(),
      inputType: element.type || 'text',
      isRichText: element.nextElementSibling?.querySelector('.note-editable') !== null,
      constraints: {}
    };
    
    // Get value based on element type
    if (element.tagName === 'SELECT') {
      fieldInfo.value = element.value;
      fieldInfo.constraints.options = Array.from(element.options).map(opt => ({
        value: opt.value,
        text: opt.text,
        selected: opt.selected
      }));
    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      fieldInfo.value = element.value;
      
      // Get input constraints
      if (element.maxLength && element.maxLength !== -1) {
        fieldInfo.constraints.maxLength = element.maxLength;
      }
      if (element.minLength && element.minLength !== -1) {
        fieldInfo.constraints.minLength = element.minLength;
      }
      if (element.max) {
        fieldInfo.constraints.max = element.max;
      }
      if (element.min) {
        fieldInfo.constraints.min = element.min;
      }
      if (element.pattern) {
        fieldInfo.constraints.pattern = element.pattern;
      }
      if (element.required) {
        fieldInfo.constraints.required = true;
      }
      
      // Get specific constraints based on input type
      switch (element.type) {
        case 'number':
        case 'range':
          fieldInfo.constraints.step = element.step;
          break;
        case 'email':
          fieldInfo.constraints.multiple = element.multiple;
          break;
        case 'file':
          fieldInfo.constraints.accept = element.accept;
          fieldInfo.constraints.multiple = element.multiple;
          break;
        case 'datetime-local':
        case 'date':
        case 'time':
          if (element.min) fieldInfo.constraints.min = element.min;
          if (element.max) fieldInfo.constraints.max = element.max;
          break;
      }
    } else if (element.isContentEditable) {
      fieldInfo.value = element.innerHTML;
    }

    // Get any data attributes
    const dataAttributes = {};
    for (let attr of element.attributes) {
      if (attr.name.startsWith('data-')) {
        dataAttributes[attr.name] = attr.value;
      }
    }
    if (Object.keys(dataAttributes).length > 0) {
      fieldInfo.dataAttributes = dataAttributes;
    }

    // Get aria attributes
    const ariaAttributes = {};
    for (let attr of element.attributes) {
      if (attr.name.startsWith('aria-')) {
        ariaAttributes[attr.name] = attr.value;
      }
    }
    if (Object.keys(ariaAttributes).length > 0) {
      fieldInfo.ariaAttributes = ariaAttributes;
    }

    fields.push(fieldInfo);
  });

  return fields;
}

// Fill multiple fields with custom values
function fillCustomFields(fields) {
  let filledCount = 0;
  
  fields.forEach(field => {
    const element = document.querySelector(`[name="${field.name}"]`);
    if (element) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = field.value;
      }
      
      const richEditor = element.nextElementSibling?.querySelector('.note-editable');
      if (richEditor) {
        richEditor.innerHTML = field.value;
      }

      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`寫入欄位 ${field.name}:`, field.value);
      filledCount++;
    }
  });

  return filledCount;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillInputs") {
    fillAllInputs();
    sendResponse({status: "completed", count: document.querySelectorAll('input').length});
  } else if (request.action === "fillExample" && request.fieldId) {
    const success = fillExampleContent(request.fieldId);
    sendResponse({status: success ? "completed" : "field_not_found"});
  } else if (request.action === "getFields") {
    const fields = getAllWritableFields();
    sendResponse({status: "completed", fields: fields});
  } else if (request.action === "fillCustomFields" && request.fields) {
    const count = fillCustomFields(request.fields);
    sendResponse({status: "completed", count: count});
  }
  return true; // Keep the message channel open for async response
});
