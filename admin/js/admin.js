/* ==========================================================================
   MOFTY DEALERSHIP — Admin Dashboard Scripts
   Works with car_system.cars (ID, Brand, Model, Price, Image,
   Transmission, Fuel, Body, Description) and car_system.admin (user_name, password).
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  function $(id) {
    return document.getElementById(id);
  }

  function money(value) {
    if (!value || value <= 0) return "POA";
    return "GH₵" + Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 0
    });
  }

  function showMsg(text, ok) {
    var m = $("form-msg");
    m.textContent = text;
    m.className = "msg show " + (ok ? "msg--ok" : "msg--err");
    if (ok) setTimeout(function () {
      m.className = "msg";
    }, 4000);
  }

  function api(path, opts) {
    opts = opts || {};
    return fetch("../api/" + path, {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (res.status === 401) {
        window.location.href = "login.html";
        throw new Error("Unauthorized");
      }
      return res.json().catch(function () {
        return {};
      }).then(function (body) {
        if (!res.ok) throw new Error((body && body.error) || "API error " + res.status);
        return body;
      });
    });
  }

  /* ---------- State ---------- */
  var editingId = null;
  var currentImage = ""; // root-relative path of the existing photo, e.g. uploads/cars/x.jpg

  /* ---------- Elements ---------- */
  var form = $("car-form");
  var imageInput = $("f-image");
  var imagePathInput = $("f-image-path");
  var imageHint = $("image-hint");
  var imagePreview = $("image-preview");

  var fields = {
    brand: $("f-brand"),
    model: $("f-model"),
    price: $("f-price"),
    body: $("f-body"),
    transmission: $("f-transmission"),
    fuel: $("f-fuel"),
    description: $("f-description")
  };

  /* Root-relative stored paths need "../" when rendered from the /admin page. */
  function assetUrl(path) {
    if (!path) return "";
    if (/^(https?:)?\/\//.test(path) || path.charAt(0) === "/") return path;
    return "../" + path;
  }

  function updateImagePreview() {
    if (imageInput.files && imageInput.files[0]) {
      imagePreview.src = URL.createObjectURL(imageInput.files[0]);
      imagePreview.style.display = "block";
      imageHint.textContent =
        "Will upload: " + imageInput.files[0].name + " on Save.";
      return;
    }
    if (currentImage) {
      imagePreview.src = assetUrl(currentImage);
      imagePreview.style.display = "block";
      imageHint.textContent = "Current photo. Pick a new one to replace it.";
      return;
    }
    imagePreview.style.display = "none";
    imageHint.textContent = "Choose a JPG, PNG or WebP photo (up to 8 MB).";
  }

  imageInput.addEventListener("change", updateImagePreview);

  /* ---------- Form: reset to add mode ---------- */
  function resetForm() {
    editingId = null;
    currentImage = "";
    imageInput.value = "";
    imagePathInput.value = "";
    form.reset();
    updateImagePreview();
    $("form-title").textContent = "Add a vehicle";
    $("edit-banner").className = "edit-banner";
  }

  $("reset-form").addEventListener("click", resetForm);
  $("cancel-edit").addEventListener("click", resetForm);

  /* ---------- Form: fill for editing ---------- */
  function startEdit(car) {
    editingId = car.id;
    currentImage = car.image || "";
    imageInput.value = "";
    imagePathInput.value = car.image || "";
    fields.brand.value = car.brand;
    fields.model.value = car.model;
    fields.price.value = car.price || "";
    fields.body.value = car.type || "";
    fields.transmission.value = car.transmission || "";
    fields.fuel.value = car.fuel || "";
    fields.description.value = car.description || "";
    updateImagePreview();

    $("form-title").textContent = "Edit vehicle";
    $("edit-name").textContent = car.brand + " " + car.model;
    $("edit-id").textContent = car.id;
    $("edit-banner").className = "edit-banner show";
    showMsg("Editing — make your changes and hit Save Vehicle", true);

    var rect = form.getBoundingClientRect();
    window.scrollBy({ top: Math.max(rect.top - 90, 0), behavior: "smooth" });
  }

  /* ---------- Submit: upload photo (if any), then add or update ---------- */
  function uploadImage() {
    if (!imageInput.files || !imageInput.files[0]) {
      return Promise.resolve(currentImage || "");
    }

    var fd = new FormData();
    fd.append("image", imageInput.files[0]);

    return fetch("../api/upload.php", { method: "POST", body: fd })
      .then(function (res) {
        if (res.status === 401) {
          window.location.href = "login.html";
          throw new Error("Unauthorized");
        }
        return res.json().catch(function () {
          return {};
        }).then(function (body) {
          if (!res.ok) throw new Error((body && body.error) || "Upload failed");
          return body.path;
        });
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    uploadImage()
      .then(function (imagePath) {
        if (imagePath) imagePathInput.value = imagePath;

        var payload = {
          brand: fields.brand.value.trim(),
          model: fields.model.value.trim(),
          price: fields.price.value.trim() === "" ? 0 : fields.price.value,
          body: fields.body.value.trim(),
          transmission: fields.transmission.value.trim(),
          fuel: fields.fuel.value.trim(),
          description: fields.description.value.trim(),
          image: imagePath
        };

        var verb = editingId ? "updated" : "added";
        var endpoint = editingId ? "update-car.php" : "add-car.php";
        if (editingId) payload.id = editingId;

        return api(endpoint, { method: "POST", body: payload });
      })
      .then(function () {
        showMsg("Vehicle " + (editingId ? "updated" : "added") + " successfully!", true);
        resetForm();
        loadCars();
      })
      .catch(function (err) {
        showMsg(err.message, false);
      })
      .finally(function () {
        btn.disabled = false;
      });
  });

  /* ---------- Render inventory table ---------- */
  function thumb(car) {
    if (car.image) {
      return '<img class="thumb" src="' + entityEscape(assetUrl(car.image)) +
             '" alt="" onerror="this.style.visibility=\'hidden\'"/>';
    }
    return '<span class="badge-char">' + (car.brand.charAt(0) || "?") + "</span>";
  }

  function entityEscape(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function renderRow(car) {
    var meta = [];
    if (car.type) meta.push(car.type);
    if (car.fuel) meta.push(car.fuel);
    if (car.transmission) meta.push(car.transmission);

    return (
      "<tr>" +
      "<td>" + thumb(car) + "</td>" +
      "<td class=\"veh-name\">" +
      car.brand +
      " " +
      car.model +
      "<small>#" +
      car.id +
      "</small></td>" +
      "<td>" + (meta.join(" · ") || "—") + "</td>" +
      "<td><span class=\"price-now\">" + money(car.price) + "</span></td>" +
      "<td><div class=\"row-actions\">" +
      '<button class="btn btn--dark btn--sm" data-action="edit" data-id="' +
      car.id +
      '">Edit</button> ' +
      '<button class="btn btn--danger btn--sm" data-action="delete" data-id="' +
      car.id +
      '" data-name="' +
      car.brand +
      " " +
      car.model +
      '">Delete</button>' +
      "</div></td>" +
      "</tr>"
    );
  }

  function loadCars() {
    var tbody = $("cars-tbody");
    tbody.innerHTML =
      '<tr><td colspan="6"><div class="empty">Loading inventory…</div></td></tr>';

    api("cars.php", { sort: "newest" })
      .then(function (cars) {
        if (!cars.length) {
          tbody.innerHTML =
            '<tr><td colspan="6"><div class="empty">No vehicles yet — add the first one!</div></td></tr>';
          return;
        }
        tbody.innerHTML = cars.map(renderRow).join("");
        bindRowActions();
      })
      .catch(function (err) {
        tbody.innerHTML =
          '<tr><td colspan="6"><div class="empty">' + err.message + "</div></td></tr>";
      });
  }

  function bindRowActions() {
    var tbody = $("cars-tbody");

    tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        api("car.php", { id: btn.getAttribute("data-id") }).then(startEdit);
      });
    });

    tbody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-name");
        if (!confirm('Delete "' + name + '" from the inventory?')) return;

        api("delete-car.php", {
          method: "POST",
          body: { id: Number(btn.getAttribute("data-id")) }
        })
          .then(function () {
            showMsg("Vehicle deleted", true);
            if (editingId === Number(btn.getAttribute("data-id"))) resetForm();
            loadCars();
          })
          .catch(function (err) {
            showMsg(err.message, false);
          });
      });
    });
  }

  /* ---------- Logout ---------- */
  $("logout").addEventListener("click", function () {
    api("logout.php", { method: "POST", body: {} }).finally(function () {
      window.location.href = "login.html";
    });
  });

  /* ---------- Boot ---------- */
  api("auth-status.php")
    .then(function (data) {
      if (!data.admin) {
        window.location.href = "login.html";
        return;
      }
      loadCars();
    })
    .catch(function () {
      window.location.href = "login.html";
    });
})();