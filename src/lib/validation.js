const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._]{3,20}$/;

export function validateRegister(values) {
  const errors = {};

  if (!values.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!values.lastName.trim()) errors.lastName = "Enter your last name.";

  if (!values.username.trim()) {
    errors.username = "Choose a username.";
  } else if (!USERNAME_RE.test(values.username.trim())) {
    errors.username = "Use 3 to 20 letters, numbers, dots or underscores.";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email.";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email, like name@example.com.";
  }

  if (!values.password) {
    errors.password = "Choose a password.";
  } else if (values.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Repeat your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "The passwords do not match.";
  }

  if (!values.address.trim()) errors.address = "Enter your address.";
  if (!values.city.trim()) errors.city = "Enter your city.";
  if (!values.zip.trim()) errors.zip = "Enter your zip code.";

  if (!values.terms) errors.terms = "You need to accept the terms to continue.";

  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!EMAIL_RE.test(email.trim()))
    errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function validateProfile(values) {
  const errors = {};
  if (!values.first_name.trim()) errors.first_name = "Enter your first name.";
  if (!values.last_name.trim()) errors.last_name = "Enter your last name.";
  if (!/^[a-zA-Z0-9._]{3,20}$/.test(values.username.trim())) {
    errors.username = "Use 3 to 20 letters, numbers, dots or underscores.";
  }
  if (!values.address.trim()) errors.address = "Enter your address.";
  if (!values.city.trim()) errors.city = "Enter your city.";
  if (!values.zip.trim()) errors.zip = "Enter your zip code.";
  return errors;
}
