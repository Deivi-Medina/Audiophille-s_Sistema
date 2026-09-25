/**
 * ============================================================
 * AUDIOPHILLE'S - LANDING PAGE JS
 * Con modales de éxito y error
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // ============================================================
  // 1. NAVBAR DINÁMICO
  // ============================================================
  const navbar = document.getElementById("dynamicNavbar");

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  let ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        handleNavbarScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  handleNavbarScroll();

  // ============================================================
  // 2. SISTEMA DE MODALES
  // ============================================================
  const modals = {
    login: document.getElementById("loginModal"),
    register: document.getElementById("registerModal"),
    success: document.getElementById("successModal"),
    error: document.getElementById("errorModal"),
  };

  const openLoginBtns = document.querySelectorAll("#openLoginBtn, #heroLoginBtn");
  const openRegisterBtns = document.querySelectorAll("#openRegisterBtn, #heroRegisterBtn, #ctaRegisterDirectBtn");
  const closeBtns = document.querySelectorAll(".close-modal");
  const switchLinks = document.querySelectorAll("[data-switch]");

  // Botones de modales de éxito/error
  const successBtn = document.getElementById("successBtn");
  const errorBtn = document.getElementById("errorBtn");

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || modal.classList.contains("active")) return;

    Object.values(modals).forEach((m) => {
      if (m && m !== modal && m.classList.contains("active")) {
        closeModalDirect(m.id);
      }
    });

    const scrollY = window.scrollY;

    modal.classList.remove("closing");
    modal.style.display = "flex";
    void modal.offsetWidth;
    modal.classList.add("active");

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const firstInput = modal.querySelector("input");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 300);
    }
  }

  function closeModalDirect(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || !modal.classList.contains("active")) return;

    const scrollY = parseInt(document.body.style.top || "0") * -1;

    modal.classList.add("closing");
    modal.classList.remove("active");

    setTimeout(() => {
      modal.style.display = "none";
      modal.classList.remove("closing");

      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      if (scrollY > 0) {
        window.scrollTo(0, scrollY);
      }
    }, 400);
  }

  function closeModal(modalId) {
    closeModalDirect(modalId);
  }

  function switchModal(fromId, toId) {
    closeModalDirect(fromId);
    setTimeout(() => openModal(toId), 450);
  }

  // ===== MODALES DE ÉXITO Y ERROR =====
  function showSuccessModal(title, message) {
    const modal = document.getElementById("successModal");
    const titleEl = document.getElementById("successTitle");
    const messageEl = document.getElementById("successMessage");

    if (titleEl) titleEl.textContent = title || "¡Éxito!";
    if (messageEl) messageEl.textContent = message || "Operación realizada correctamente.";

    // Cerrar otros modales primero
    Object.values(modals).forEach((m) => {
      if (m && m !== modal && m.classList.contains("active")) {
        closeModalDirect(m.id);
      }
    });

    openModal("successModal");
  }

  function showErrorModal(title, message) {
    const modal = document.getElementById("errorModal");
    const titleEl = document.getElementById("errorTitle");
    const messageEl = document.getElementById("errorMessage");

    if (titleEl) titleEl.textContent = title || "Error";
    if (messageEl) messageEl.textContent = message || "Ha ocurrido un error.";

    Object.values(modals).forEach((m) => {
      if (m && m !== modal && m.classList.contains("active")) {
        closeModalDirect(m.id);
      }
    });

    openModal("errorModal");
  }

  // Botones de modales de éxito/error
  if (successBtn) {
    successBtn.addEventListener("click", function () {
      closeModal("successModal");
    });
  }

  if (errorBtn) {
    errorBtn.addEventListener("click", function () {
      closeModal("errorModal");
    });
  }

  // Cerrar modales de éxito/error al hacer clic fuera
  document.getElementById("successModal")?.addEventListener("click", function (e) {
    if (e.target === this) closeModal("successModal");
  });
  document.getElementById("errorModal")?.addEventListener("click", function (e) {
    if (e.target === this) closeModal("errorModal");
  });

  // ===== MODALES DE LOGIN Y REGISTRO =====
  openLoginBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openModal("loginModal");
      });
    }
  });

  openRegisterBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openModal("registerModal");
      });
    }
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const modalId = this.dataset.modal;
      if (modalId) closeModal(modalId);
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      Object.keys(modals).forEach((key) => {
        const modal = modals[key];
        if (modal && modal.classList.contains("active")) {
          closeModal(modal.id);
        }
      });
    }
  });

  switchLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const target = this.dataset.switch;
      if (!target) return;

      const parentModal = this.closest(".modal");
      if (!parentModal) return;

      const fromId = parentModal.id;
      let toId = target === "login" ? "loginModal" : "registerModal";

      switchModal(fromId, toId);
    });
  });

  // ============================================================
  // 3. VALIDACIÓN DE CONTRASEÑA (SIN COLAPSO)
  // ============================================================
  const passwordInput = document.getElementById("registerPasswordModal");
  const requirementsContainer = document.getElementById("passwordRequirementsModal");

  if (passwordInput && requirementsContainer) {
    const requirements = {
      length: { regex: /.{8,}/ },
      uppercase: { regex: /[A-Z]/ },
      lowercase: { regex: /[a-z]/ },
      number: { regex: /[0-9]/ },
      symbol: { regex: /[^A-Za-z0-9]/ },
    };

    function validatePassword(password) {
      let allValid = true;
      Object.keys(requirements).forEach((key) => {
        const item = requirementsContainer.querySelector(`[data-rule="${key}"]`);
        if (!item) return;
        const isValid = requirements[key].regex.test(password);
        const icon = item.querySelector(".req-icon");
        if (isValid) {
          item.classList.add("valid");
          if (icon) icon.textContent = "✓";
        } else {
          item.classList.remove("valid");
          if (icon) icon.textContent = "⬜";
          allValid = false;
        }
      });
      return allValid;
    }

    function toggleRequirements(show) {
      if (show) {
        requirementsContainer.classList.add("visible");
      } else {
        requirementsContainer.classList.remove("visible");
      }
    }

    let debounceTimer;
    passwordInput.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        validatePassword(this.value);
        toggleRequirements(this.value.length > 0);
      }, 100);
    });

    passwordInput.addEventListener("focus", function () {
      toggleRequirements(true);
      if (this.value.length > 0) {
        validatePassword(this.value);
      }
    });

    passwordInput.addEventListener("blur", function () {
      if (this.value.length === 0) {
        setTimeout(() => {
          if (!passwordInput.matches(":focus") && passwordInput.value.length === 0) {
            toggleRequirements(false);
          }
        }, 200);
      }
    });

    toggleRequirements(false);
  }

  // ============================================================
  // 4. TOGGLE DE CONTRASEÑA
  // ============================================================
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const wrapper = this.closest(".password-wrapper");
      if (!wrapper) return;

      const input = wrapper.querySelector("input");
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      const icon = this.querySelector("i");
      if (icon) {
        const iconName = isPassword ? "eye-off" : "eye";
        icon.setAttribute("data-lucide", iconName);
        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
      }
    });
  });

  // ============================================================
  // 5. MANEJO DE FORMULARIOS
  // ============================================================
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      const inputs = this.querySelectorAll("input[required]");
      let isValid = true;
      let firstError = null;

      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add("error");
          if (!firstError) firstError = input;
          setTimeout(() => input.classList.remove("error"), 3000);
        } else {
          input.classList.remove("error");
        }
      });

      if (!isValid) {
        e.preventDefault();
        const fieldName = firstError ? firstError.placeholder || "campo" : "campo";
        showErrorModal("Campos incompletos", `Por favor, completa el campo: ${fieldName}`);
        if (firstError) {
          setTimeout(() => firstError.focus(), 300);
        }
      }
    });
  });

  // ============================================================
  // 6. SCROLL SUAVE
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#") return;

      const targetId = href.substring(1);
      const target = document.getElementById(targetId);

      if (target) {
        e.preventDefault();
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset;
        const navbarHeight = navbar.offsetHeight;
        window.scrollTo({
          top: offsetTop - navbarHeight - 20,
          behavior: "smooth",
        });
      }
    });
  });

  // ============================================================
  // 7. PARALLAX EN HERO
  // ============================================================
  const hero = document.querySelector(".hero-cosmic");
  if (hero) {
    let heroTicking = false;
    window.addEventListener("scroll", function () {
      if (!heroTicking) {
        window.requestAnimationFrame(function () {
          const scrolled = window.pageYOffset;
          const heroContent = hero.querySelector(".hero-content");
          if (heroContent && scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.05}px)`;
            heroContent.style.opacity = 1 - scrolled / (window.innerHeight * 1.5);
          }
          heroTicking = false;
        });
        heroTicking = true;
      }
    });
  }

  // ============================================================
  // 8. ANIMACIÓN DE ENTRADA
  // ============================================================
  if ("IntersectionObserver" in window) {
    const animateElements = document.querySelectorAll(
      ".flip-card, .stat-preview-card, .orbit-feature-item, .mockup-clean-wrapper, .game-box-layout",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    animateElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)";
      observer.observe(el);
    });
  }

  // ============================================================
  // 9. BOTÓN DE SCROLL TOP
  // ============================================================
  let scrollTopBtn = document.getElementById("scrollTopBtn");
  if (!scrollTopBtn) {
    scrollTopBtn = document.createElement("button");
    scrollTopBtn.id = "scrollTopBtn";
    scrollTopBtn.innerHTML = "↑";
    scrollTopBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #9d4edd;
            color: white;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 20px rgba(157, 78, 221, 0.25);
            z-index: 999;
            font-family: 'Inter', sans-serif;
        `;
    document.body.appendChild(scrollTopBtn);
  }

  let scrollBtnTicking = false;
  window.addEventListener("scroll", function () {
    if (!scrollBtnTicking) {
      window.requestAnimationFrame(function () {
        if (window.pageYOffset > 500) {
          scrollTopBtn.style.opacity = "1";
          scrollTopBtn.style.visibility = "visible";
        } else {
          scrollTopBtn.style.opacity = "0";
          scrollTopBtn.style.visibility = "hidden";
        }
        scrollBtnTicking = false;
      });
      scrollBtnTicking = true;
    }
  });

  scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ============================================================
  // 10. MENSAJES DE SESIÓN (PHP) - MODALES DE ÉXITO O ERROR
  // ============================================================
  (function () {
    const body = document.body;
    const message = body.getAttribute("data-message");
    const type = body.getAttribute("data-type");

    console.log("📨 Mensaje de sesión:", message, "Tipo:", type);

    if (message && message.trim() !== "" && message.trim() !== "null") {
      setTimeout(function () {
        if (type === "success") {
          showSuccessModal("¡Bienvenido a Audiophille's!", message.trim());
        } else if (type === "error") {
          showErrorModal("Error", message.trim());
        } else {
          // Si no hay tipo específico, mostrar como éxito
          showSuccessModal("Aviso", message.trim());
        }
      }, 500);
    }
  })();

  // ============================================================
  // 11. INICIALIZAR LUCIDE
  // ============================================================
  if (typeof lucide !== "undefined") {
    try {
      lucide.createIcons();
      console.log("✅ Lucide icons cargados correctamente");
    } catch (e) {
      console.error("❌ Error al cargar Lucide:", e);
    }
  }

  // ============================================================
  // 12. CONSOLA DE BIENVENIDA
  // ============================================================
  console.log("%c🎵 Audiophille's", "font-size: 24px; font-weight: bold; color: #9d4edd;");
  console.log("%cLa música no solo se escucha...", "font-size: 14px; color: #9a8aa8;");
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #6a5a78;");
  console.log("%c✨ Ecosistema Autónomo", "color: #9d4edd;");
  console.log("%c🔗 Choque de Órbitas", "color: #9d4edd;");
  console.log("%c📊 Mapeo de Hábitos", "color: #9d4edd;");
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #6a5a78;");
  console.log("✅ Todas las funcionalidades cargadas correctamente.");
});
