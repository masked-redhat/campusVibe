const createText = (otp) => {
  return (
    "Do not share your OTP with anyone\n \
This OTP is valid for only 5 minutes\n \
OTP: " + otp
  );
};

const OTPVERIFICATION = {
  SUBJECT: "CampusVibe",
  TEXT: createText,
};

export default OTPVERIFICATION;
