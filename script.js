document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tab Switching
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetScreen = item.getAttribute('data-target');

      navItems.forEach(nav => nav.classList.remove('active'));
      screens.forEach(screen => screen.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(targetScreen).classList.add('active');
    });
  });

  // Keypad Functionality
  const phoneInput = document.getElementById('phone-number');
  const keys = document.querySelectorAll('.key');
  const deleteBtn = document.getElementById('delete-btn');

  keys.forEach(key => {
    key.addEventListener('click', () => {
      const val = key.getAttribute('data-value');
      phoneInput.value += val;
    });
  });

  deleteBtn.addEventListener('click', () => {
    phoneInput.value = phoneInput.value.slice(0, -1);
  });
});