<script setup lang="ts">
import { ref } from "vue";
import LogoWithNameAndTicker from "../assets/LogoWithNameAndTicker.svg";

const email = ref("");
const isLoading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleSubmit = async (e: Event) => {
  e.preventDefault();

  successMessage.value = "";
  errorMessage.value = "";

  if (!validateEmail(email.value)) {
    errorMessage.value = "Please enter a valid email address.";
    return;
  }

  isLoading.value = true;

  try {
    const response = await fetch(
      "https://lbfmazwwnoyacvftgahc.supabase.co/functions/v1/insert-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({ email: email.value }),
      }
    );

    if (response.ok) {
      successMessage.value =
        "Thank you! We'll notify you when VoltRWA launches.";
      email.value = "";
    } else {
      errorMessage.value = "Something went wrong. Please try again.";
    }
  } catch (error) {
    errorMessage.value =
      "Network error. Please check your connection and try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    class="landing-container min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
  >
    <!-- Background gradient orbs -->
    <div
      class="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-pulse-slow"
    ></div>
    <div
      class="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl animate-pulse-slow-delayed"
    ></div>

    <div class="max-w-2xl w-full space-y-12 relative z-10">
      <div class="flex justify-center">
        <img
          :src="LogoWithNameAndTicker"
          alt="VoltRWA Logo"
          class="w-full max-w-md h-auto drop-shadow-2xl logo-glow"
        />
      </div>

      <div class="text-center space-y-6">
        <h1 class="hero-text text-4xl md:text-5xl font-bold">
          The Future of Real World Assets on XRP
        </h1>
        <p class="text-lg md:text-xl text-base-content/80 leading-relaxed">
          Join the revolution that's bridging physical assets with blockchain
          efficiency on the XRP Ledger.
        </p>
      </div>

      <div class="space-y-4">
        <form
          @submit="handleSubmit"
          class="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
        >
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="modern-input flex-1"
            :disabled="isLoading"
            required
          />
          <button type="submit" class="gradient-button" :disabled="isLoading">
            <span v-if="!isLoading">Join Waitlist</span>
            <span v-else class="flex items-center gap-2">
              <svg
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </span>
          </button>
        </form>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>

    <div class="text-center text-sm text-base-content/60 absolute bottom-5">
      <p class="tracking-wider">Powered by XRP Ledger • Built for the Future</p>
    </div>
  </div>
</template>

<style scoped>
.landing-container {
  background: linear-gradient(180deg, #0d0d1b 0%, #0a0a15 50%, #0d0d1b 100%);
}

.hero-text {
  background: linear-gradient(135deg, #29abe2 0%, #3f7ff5 50%, #893ceb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(41, 171, 226, 0.3);
  animation: glow 3s ease-in-out infinite alternate;
}

.logo-glow {
  filter: drop-shadow(0 0 30px rgba(41, 171, 226, 0.3));
  transition: all 0.3s ease;
}

.logo-glow:hover {
  filter: drop-shadow(0 0 40px rgba(41, 171, 226, 0.5));
  transform: scale(1.02);
}

.modern-input {
  background: rgba(13, 13, 27, 0.6);
  border: 1px solid rgba(41, 171, 226, 0.3);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #ffffff;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.modern-input:focus {
  outline: none;
  border-color: #29abe2;
  box-shadow: 0 0 20px rgba(41, 171, 226, 0.3);
  background: rgba(13, 13, 27, 0.8);
}

.modern-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.gradient-button {
  background: linear-gradient(135deg, #29abe2 0%, #3f7ff5 50%, #893ceb 100%);
  color: white;
  font-weight: 600;
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(41, 171, 226, 0.4);
  position: relative;
  overflow: hidden;
}

.gradient-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.gradient-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(41, 171, 226, 0.6);
}

.gradient-button:hover::before {
  left: 100%;
}

.gradient-button:active {
  transform: translateY(0);
}

.gradient-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.gradient-button:disabled:hover {
  transform: none;
  box-shadow: 0 4px 15px rgba(41, 171, 226, 0.4);
}

.modern-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success-message {
  text-align: center;
  color: #10b981;
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1) 0%,
    rgba(16, 185, 129, 0.05) 100%
  );
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-in-out;
  max-width: 500px;
  margin: 0 auto;
}

.error-message {
  text-align: center;
  color: #ef4444;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.1) 0%,
    rgba(239, 68, 68, 0.05) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-in-out;
  max-width: 500px;
  margin: 0 auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 20px rgba(41, 171, 226, 0.3);
  }
  to {
    text-shadow: 0 0 30px rgba(137, 60, 235, 0.4),
      0 0 40px rgba(41, 171, 226, 0.3);
  }
}

@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes pulse-slow-delayed {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.15);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-pulse-slow-delayed {
  animation: pulse-slow-delayed 8s ease-in-out infinite;
  animation-delay: 2s;
}
</style>
