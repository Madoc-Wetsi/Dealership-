/* ==========================================================================
   MOFTY DEALERSHIP — Site Scripts (fetches all vehicle data from the PHP API)
   ==========================================================================
   API reference:
     GET api/cars.php            list + filter (search, brand, body, fuel,
                                 price_min, price_max, featured, sort, limit)
     GET api/cars.php?count=1    -> { total }
     GET api/car.php?id={slug}   single vehicle
     GET api/brands.php          distinct brands for the filter dropdown
     POST api/add-car.php        insert a vehicle (JSON body)
   ========================================================================== */

(function () {
  "use strict";

  var money = window.formatMoney;

  /* ---------- API helper ---------- */
  function api(path, params) {
    var qs = params
      ? "?" +
        Object.keys(params)
          .filter(function (k) {
            return params[k] !== "" && params[k] !== null && params[k] !== undefined;
          })
          .map(function (k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
          })
          .join("&")
      : "";

    return fetch("api/" + path + qs, { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(
            function (body) {
              throw new Error((body && body.error) || "API error " + res.status);
            },
            function () {
              throw new Error("API error " + res.status);
            }
          );
        }
        return res.json();
      });
  }

  function apiError(el, message) {
    if (el) {
      el.innerHTML =
        '<div class="no-results"><strong>Could not load vehicles.</strong><br>' +
        "<span>&nbsp;</span>" +
        '<span style="font-size:.85em">' +
        message +
        "</span><br>" +
        '<span style="font-size:.85em">Check your DB setup and that you are serving via PHP (not file://).</span></div>';
    }
  }

  /* ---------- Shared: mobile nav + footer year ---------- */
  function initShell() {
    var toggle = document.querySelector(".nav__toggle");
    var links = document.querySelector(".nav__links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        links.classList.toggle("is-open");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          links.classList.remove("is-open");
        });
      });
    }

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------- Shared: car card ---------- */
  function carCardHTML(car) {
    var tag = car.tag
      ? '<span class="car-card__tag">' + car.tag + "</span>"
      : "";

    var specs = [];
    if (car.fuel) specs.push(car.fuel);
    if (car.transmission) specs.push(car.transmission);
    if (car.type) specs.push(car.type);

    return (
      '<article class="car-card">' +
      '<a href="vehicle.html?id=' +
      car.id +
      '">' +
      '<div class="car-card__img">' +
      window.carImage(car) +
      tag +
      "</div>" +
      '<div class="car-card__body">' +
      '<h3 class="car-card__name">' +
      car.brand +
      " " +
      car.model +
      "</h3>" +
      '<p class="car-card__type">' +
      (car.type || car.brand) +
      "</p>" +
      '<div class="car-card__specs">' +
      specs
        .map(function (s) {
          return "<span>" + s + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="car-card__footer">' +
      '<span class="car-card__price">' +
      (car.oldPrice ? "<del>" + money(car.oldPrice) + "</del>" : "") +
      money(car.price) +
      "</span>" +
      '<span class="btn btn--primary">View</span>' +
      "</div>" +
      "</div>" +
      "</a>" +
      "</article>"
    );
  }

  /* ---------- Home: latest arrivals + stock count ---------- */
  function initFeatured() {
    var grid = document.getElementById("featured-grid");
    var countEl = document.getElementById("inventory-count");
    if (!grid) return;

    grid.innerHTML = '<div class="no-results">Loading vehicles…</div>';

    api("cars.php", { sort: "newest", limit: 3 })
      .then(function (cars) {
        grid.innerHTML = cars.map(carCardHTML).join("");
      })
      .catch(function (err) {
        apiError(grid, err.message);
      });

    if (countEl) {
      api("cars.php", { count: 1 })
        .then(function (data) {
          countEl.textContent = data.total || 0;
        })
        .catch(function () {
          /* silent — the stat is decorative */
        });
    }
  }

  /* ---------- Inventory: filters (server-side) + grid ---------- */
  var currentFilters = {
    search: "",
    body: "all",
    brand: "all",
    price: "0-999999999",
    fuel: "all",
    sort: "default"
  };

  function initFilters() {
    var container = document.querySelector(".inventory-body");
    if (!container) return;

    var brandSelect = document.getElementById("filter-brand");
    var bodySelect = document.getElementById("filter-body");
    var fuelSelect = document.getElementById("filter-fuel");
    var priceSelect = document.getElementById("filter-price");
    var searchBox = document.getElementById("filter-search");
    var sortSelect = document.getElementById("filter-sort");
    var grid = document.getElementById("inventory-grid");
    var countEl = document.getElementById("result-count");
    var resetBtn = document.getElementById("filter-reset");

    // Brand options come from the database
    api("brands.php")
      .then(function (brands) {
        brands.forEach(function (b) {
          var opt = document.createElement("option");
          opt.value = b;
          opt.textContent = b;
          brandSelect.appendChild(opt);
        });
      })
      .catch(function () {
        /* leave the dropdown with just "All brands" */
      });

    var inFlight = null;

    function apply() {
      countEl.textContent = "Loading…";
      grid.innerHTML = '<div class="no-results">Searching inventory…</div>';

      var priceParts = (currentFilters.price || "0-999999999").split("-");
      var params = {
        search: currentFilters.search,
        brand: currentFilters.brand === "all" ? "" : currentFilters.brand,
        body: currentFilters.body === "all" ? "" : currentFilters.body,
        fuel: currentFilters.fuel === "all" ? "" : currentFilters.fuel,
        price_min: priceParts[0] || "",
        price_max: priceParts[1] || "",
        sort: currentFilters.sort === "default" ? "" : currentFilters.sort
      };

      var request = api("cars.php", params);
      inFlight = {
        id: Date.now(),
        promise: request
      };
      var thisFlight = inFlight;

      request
        .then(function (cars) {
          // ignore stale responses if the user changed filters mid-flight
          if (inFlight !== thisFlight) return;
          countEl.textContent =
            cars.length + " vehicle" + (cars.length === 1 ? "" : "s");
          grid.innerHTML = cars.length
            ? cars.map(carCardHTML).join("")
            : '<div class="no-results"><strong>No vehicles match.</strong><br>Try clearing a filter or two.</div>';
        })
        .catch(function (err) {
          if (inFlight !== thisFlight) return;
          countEl.textContent = "—";
          apiError(grid, err.message);
        });
    }

    brandSelect.addEventListener("change", function () {
      currentFilters.brand = this.value;
      apply();
    });
    bodySelect.addEventListener("change", function () {
      currentFilters.body = this.value;
      apply();
    });
    fuelSelect.addEventListener("change", function () {
      currentFilters.fuel = this.value;
      apply();
    });
    priceSelect.addEventListener("change", function () {
      currentFilters.price = this.value;
      apply();
    });
    searchBox.addEventListener("input", debounce(function () {
      currentFilters.search = this.value.trim();
      apply();
    }, 300));
    sortSelect.addEventListener("change", function () {
      currentFilters.sort = this.value;
      apply();
    });
    resetBtn.addEventListener("click", function () {
      currentFilters = {
        search: "",
        body: "all",
        brand: "all",
        price: "0-999999999",
        fuel: "all",
        sort: "default"
      };
      [brandSelect, bodySelect, fuelSelect, priceSelect, sortSelect].forEach(
        function (s) {
          s.value = "all";
        }
      );
      searchBox.value = "";
      apply();
    });

    apply();
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  /* ---------- Vehicle detail ---------- */
  function initVehicle() {
    var root = document.getElementById("vehicle-root");
    if (!root) return;

    var id = new URLSearchParams(window.location.search).get("id");

    root.innerHTML = '<div class="no-results">Loading vehicle…</div>';

    api("car.php", { id: id })
      .then(function (car) {
        document.title = car.brand + " " + car.model + " — Mofty Dealership";

        var specs = [];
        if (car.type) specs.push(spec("Body", car.type));
        if (car.fuel) specs.push(spec("Fuel", car.fuel));
        if (car.transmission) specs.push(spec("Transmission", car.transmission));

        root.innerHTML =
          '<div class="vehicle-gallery">' +
          window.carImage(car) +
          '<div class="spec-grid">' +
          specs.join("") +
          "</div>" +
          "</div>";

        document.getElementById("vehicle-title").textContent =
          car.brand + " " + car.model;
        var sub = document.getElementById("vehicle-sub");
        sub.textContent = [car.type, car.fuel, car.transmission]
          .filter(Boolean)
          .join(" · ");

        var panel = document.getElementById("buy-panel");
        if (panel) {
          panel.innerHTML =
            '<div class="buy-panel__price">' +
            (car.oldPrice ? "<del>" + money(car.oldPrice) + "</del>" : "") +
            money(car.price) +
            "</div>" +
            '<div class="buy-panel__est">Est. monthly from <strong>' +
            money(Math.round((car.price * 0.8 * 0.011) / 12) * 12) +
            "</strong>/mo</div>" +
            '<a class="btn btn--primary btn--block" href="financing.html">Initiate Financing</a>' +
            '<a class="btn btn--outline btn--block" href="contact.html">Book a Test Drive</a>';
        }

        var desc = document.getElementById("vehicle-desc");
        if (desc) {
          desc.textContent =
            car.description ||
            "For full history, condition and availability details, contact our sales team.";
        }
      })
      .catch(function (err) {
        document.title = "Not Found — Mofty Dealership";
        root.innerHTML =
          '<div class="no-results"><strong>Vehicle not found.</strong><br>' +
          err.message +
          "<br><a href=\"inventory.html\">Browse the full inventory</a></div>";
      });

    function spec(label, value) {
      return (
        '<div class="spec-item"><b>' +
        value +
        "</b><span>" +
        label +
        "</span></div>"
      );
    }
  }

  /* ---------- Financing calculator ---------- */
  function initCalculator() {
    var calc = document.getElementById("calc");
    if (!calc) return;

    var price = document.getElementById("calc-price");
    var down = document.getElementById("calc-down");
    var downVal = document.getElementById("calc-down-value");
    var term = document.getElementById("calc-term");
    var rate = document.getElementById("calc-rate");
    var rateVal = document.getElementById("calc-rate-value");
    var pay = document.getElementById("calc-payment");
    var totalInt = document.getElementById("calc-total-interest");
    var totalPay = document.getElementById("calc-total-pay");

    function updateDownLabel() {
      if (downVal) downVal.textContent = money(parseInt(down.value, 10));
    }
    updateDownLabel();

    function recalc() {
      var p = Math.max(0, parseInt(price.value, 10) || 0);
      var d = Math.min(p, parseInt(down.value, 10) || 0);
      var n = parseInt(term.value, 10);
      var r = (parseFloat(rate.value) || 0) / 100 / 12;

      var principal = p - d;
      var monthly;
      if (r === 0 || n === 0) {
        monthly = principal / n;
      } else {
        monthly = (principal * r) / (1 - Math.pow(1 + r, -n));
      }
      monthly = isFinite(monthly) ? monthly : 0;

      pay.textContent = money(Math.round(monthly));
      totalPay.textContent = money(Math.round(monthly * n));
      totalInt.textContent = money(Math.round(monthly * n - principal));
    }

    [price, down, term, rate].forEach(function (el) {
      if (el) el.addEventListener("input", recalc);
    });
    if (down) down.addEventListener("input", updateDownLabel);
    if (rate) {
      rate.addEventListener("input", function () {
        rateVal.textContent = rate.value + "%";
      });
    }

    recalc();
  }

  /* ---------- Contact form (demo) ---------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    var status = document.getElementById("form-status");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (status) {
        status.textContent =
          "Thanks! Our sales team will reach out within one business day.";
        status.style.color = "var(--color-success)";
      }
      form.reset();
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initShell();
    initFeatured();
    initFilters();
    initVehicle();
    initCalculator();
    initContactForm();
  });
})();