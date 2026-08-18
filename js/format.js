/* ==========================================================================
   MOFTY DEALERSHIP — Presentation Helpers (no data here)
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Money ---------- */
  window.formatMoney = function (value) {
    if (value === null || value === undefined || value === 0 || value < 0) {
      return "POA";
    }
    return "GH₵" + Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 0
    });
  };

  /* ---------- HTML escaping (keeps paths/brands safe in markup) ---------- */
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- Car visual ----------
     Returns a real <img> when car.image is set (stored path from uploads/),
     otherwise the SVG placeholder driven by car.color. */
  window.carImage = function (car) {
    if (car && car.image) {
      var alt = escapeHtml((car.brand || "") + " " + (car.model || ""));
      return (
        '<img class="car-photo" src="' +
        escapeHtml(car.image) +
        '" alt="' +
        alt +
        '" loading="lazy" onerror="this.style.display=\'none\'" />'
      );
    }
    return window.carSVG((car && car.color) || "#a61426");
  };

  window.carSVG = function (bodyColor, wheels) {
    var hue = bodyColor || "#a61426";
    var w = wheels === undefined ? "#111318" : wheels;

    return (
      '<svg viewBox="0 0 460 150" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<g transform="translate(12 6)">' +
      '<ellipse cx="230" cy="126" rx="196" ry="12" fill="rgba(20,24,29,0.12)"/>' +
      '<path d="M28 104 h22 l14 -26 h60 l10 -34 q4 -8 12 -8 h78 l18 18 q6 5 16 5 h38 l30 26 q6 5 14 5 v14 h-52 q-8 0 -8 6 q0 4 -8 4 h-212 q-8 0 -8 -6 q0 -4 -8 -4 h-26 v-16z" fill="' + hue + '"/>' +
      '<path d="M126 74 l8 -22 h66 l-8 24 h-66z" fill="#9db2c4"/>' +
      '<path d="M196 52 h58 l30 26 h-66z" fill="#8ba3b7"/>' +
      '<path d="M120 78 q-4 14 -2 24" stroke="rgba(0,0,0,0.18)" stroke-width="2" fill="none"/>' +
      '<path d="M36 100 l14 -20 q2 -3 6 -3 h12 q2 0 2 2 l-8 21 h-26z" fill="#fff7c9"/>' +
      '<path d="M352 100 h38 v10 h-44 q2 -3 6 -10z" fill="#ff3b30"/>' +
      '<g><circle cx="92" cy="104" r="24" fill="' + w + '"/><circle cx="92" cy="104" r="13" fill="#3b444d"/><circle cx="92" cy="104" r="5" fill="#cfd6dd"/></g>' +
      '<g><circle cx="318" cy="104" r="24" fill="' + w + '"/><circle cx="318" cy="104" r="13" fill="#3b444d"/><circle cx="318" cy="104" r="5" fill="#cfd6dd"/></g>' +
      '<path d="M40 112 q190 18 320 0" stroke="rgba(0,0,0,0.15)" stroke-width="3" fill="none"/>' +
      "</g></svg>"
    );
  };
})();