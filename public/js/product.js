//import { body, header } from "express-validator"
import {messageAlert} from './utils.js'

(function () {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  var forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.prototype.slice.call(forms)
    .forEach(function (form) {
      
      form.addEventListener('submit', async function (event) {
          
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
          console.log("requuired")
        }
        else{
          event.preventDefault()
          event.stopPropagation()
          const form = event.target;

          loadStatus(true)
          
          const formData = new FormData(form);
          
          const url = form.action; // Extract the action attribute from the form

          try {
              let method;

              if (form.id == "update-product-form"){
                  method = "PUT";
                  console.log("updating media...")
              }else{
                  method = "POST";
                  console.log("creating media...")
              };
              
              const response = await uploadFile(formData, progressBar, url, method);
              const result = await response.json();

              if (response.ok) {
                  messageAlert(
                      title = "Upload Successful",
                      message = result.message,
                      redirectTo = result.redirectTo,
                      classType = "text-success",
                      btnType = "btn-success",
                  )
              } else {
                  messageAlert(
                      title = "Upload failed",
                      message = result.message,
                      redirectTo = false,
                      classType = "text-success",
                      btnType = "btn-success",
                  )
                  
              }
          } catch (error) {
                  messageAlert(
                      title = "Upload failed",
                      message = error.message,
                      redirectTo = false,
                      classType = "text-danger",
                      btnType = "btn-danger",
                  )

          } finally {
              progressBar.style.display = 'none';
          }
          loadStatus(false)
      }

        form.classList.add('was-validated')
      }, false)
    })
    
})()


try{

    const deleteButtons = document.querySelectorAll('.delete-image-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const imageId = this.dataset.id;
      if (confirm('Are you sure you want to delete this image?')) {
        fetch(`/admin/product/delete-image/${imageId}`, { method: 'DELETE' })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Remove image element from the DOM
              this.parentElement.remove();
            } else {
              alert('Error deleting image');
            }
          })
          .catch(err => console.error('Error deleting image:', err));
      }
    });
  });
}
catch{

}


try {
  document.getElementById('id_image_group').onclick = function(event){
      document.getElementById('id_image_file').click();
  };
}  catch (TypeError) {

}


function loadStatus(status){
  let statusEl = document.getElementsByClassName('status')
  let btn = document.getElementById('btn')
  let progressBar = document.getElementById('progressBar')
  let deleteBtn = document.querySelector('#delete')

  if (status) {
      try {
          progressBar.style.display = 'block';
          btn.classList.add('disabled')
          deleteBtn.classList.add('disabled')
          for (let i of statusEl){
              i.classList.remove('d-none')
              console.log("removing")
          } 
      } catch (error) {
          
      }
      
  }
  else{
      try {
          btn.classList.remove('disabled')
          deleteBtn.classList.remove('disabled')
          progressBar.style.display = 'none';
          for (let i of statusEl){
              i.classList.add('d-none')
              console.log("adding")
          }
      } catch (error) {
          
      }
  }
}

async function uploadFile(formData, progressBar, url, method) {
  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
      xhr.upload.onprogress = function(event) {
          if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              progressBar.value = percentComplete;
          }
      };

      xhr.onload = function() {
          resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              json: () => Promise.resolve(JSON.parse(xhr.responseText))
          });
      };

      xhr.onerror = function() {
          reject(new Error('Network error'));
      };

      xhr.open(method, url, true); // Use the dynamic URL
      xhr.withCredentials = true;
      xhr.send(formData);
  });
}

deleteMedia()


function deleteMedia(){
  let displayError = document.querySelector('#error')
  try{
      let deleteBtn = document.querySelector('#delete')
      deleteBtn.addEventListener('click', async ()=>{
  
          let url = deleteBtn.dataset.url
          let method = "DELETE"
          let data = JSON.stringify({})
  
          let option = {
              method: method,
              credentials: "include",
              body:data
          }
          loadStatus(true)
          const response = await fetch(url, option)
          const result = await response.json();
          console.log(result)
          if (response.ok) {
              messageAlert(
              title = "Success",
              message = result.message,
              redirectTo = result.redirectTo,
              classType = "text-danger",
              btnType = "btn-danger",
              )
              
          } 
          else {
              try {
              for(let i of result.errors){
                  displayError.insertAdjacentHTML(
                  'beforeend',
                  `<li>${i.msg}</li>`
                  
                  )
              }
              } catch {
              let errMessage;
              if (result.detail) errMessage = result.detail
              else if (result.message) errMessage = result.message;
              displayError.insertAdjacentHTML(
                  'beforeend',
                  `<li>${errMessage}</li>`
              )
              }
          }
          loadStatus(false)
      })
  }catch{
  
  }
}


function readURL(input){
  let reader = new FileReader();
  reader.onload = function(e){
  $('#id_image_display')
      .attr('src', e.target.result)
  };
  reader.readAsDataURL(input.files[0]);
}

try {
  document.addEventListener("DOMContentLoaded", () => {
  
  const selectedSizesContainer = document.getElementById("selected-sizes");
  const addSizeBtn = document.getElementById("add-size");
  const sizesJsonInput = document.getElementById("sizes-json");

  function updateHiddenInput() {
    const payload = [];
    selectedSizesContainer.querySelectorAll(".size-wrapper").forEach(wrapper => {
      payload.push({
        size_id: parseInt(wrapper.querySelector(".size-select").value),
        stock: parseInt(wrapper.querySelector(".size-stock").value) || 0,
        price_override: wrapper.querySelector(".size-price").value || null
      });
    });
    sizesJsonInput.value = JSON.stringify(payload);
  }

  function getUsedSizeIds() {
    return Array.from(selectedSizesContainer.querySelectorAll(".size-select"))
      .map(sel => parseInt(sel.value));
  }

  function createSizeRow(sizeId = null, stock = 0, price = null) {
    const used = getUsedSizeIds();

    // Build dropdown
    let optionsHtml = sizesData.map(s => {
      const disabled = used.includes(s.id) && s.id !== sizeId ? "disabled" : "";
      const selected = s.id === sizeId ? "selected" : "";
      return `<option value="${s.id}" ${disabled} ${selected}>${s.name}</option>`;
    }).join("");

    const wrapper = document.createElement("div");
    wrapper.classList.add("border", "p-2", "mb-2", "size-wrapper");
    wrapper.innerHTML = `
      <div class="form-row align-items-end">
        <div class="col">
          <label>Size</label>
          <select class="form-control size-select">${optionsHtml}</select>
        </div>
        <div class="col">
          <label>Stock</label>
          <input type="number" class="form-control size-stock" value="${stock}">
        </div>
        <div class="col">
          <label>Price override (optional)</label>
          <input type="number" class="form-control size-price" value="${price ?? ""}">
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-danger remove-size">Remove</button>
        </div>
      </div>
    `;

    // Remove handler
    wrapper.querySelectorAll(".remove-size").forEach(btn => {
      btn.addEventListener("click", () => {
        wrapper.remove();
        refreshDropdowns();
        updateHiddenInput();
      });
    });

    // Change handlers
    wrapper.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("input", () => {
        refreshDropdowns();
        updateHiddenInput();
      });
    });

    selectedSizesContainer.appendChild(wrapper);
    refreshDropdowns();
    updateHiddenInput();
  }

  function refreshDropdowns() {
    const used = getUsedSizeIds();
    selectedSizesContainer.querySelectorAll(".size-select").forEach(sel => {
      const currentVal = parseInt(sel.value);
      sel.querySelectorAll("option").forEach(opt => {
        const val = parseInt(opt.value);
        opt.disabled = used.includes(val) && val !== currentVal;
      });
    });
  }

  // Add button
  addSizeBtn.addEventListener("click", () => {
    createSizeRow();
  });

  // Initial update
  updateHiddenInput();
});
}
catch (e) {
  console.log("No sizes available", e);
}