import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";
import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import { notification } from "antd";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayoutLanding from "layouts/authentication/components/BasicLayoutLanding";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import AuthService from "services/auth-service";
import { AuthContext } from "context";
import axios from "axios";

function Login() {
  const authContext = useContext(AuthContext);

  const [inputs, setInputs] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ emailError: false, passwordError: false });
  const [credentialsErrors, setCredentialsError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [shopId, setShopId] = useState("");

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const changeHandler = (e) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (inputs.email.trim().length === 0 || !inputs.email.trim().match(mailFormat)) {
      setErrors({ ...errors, emailError: true });
      setLoading(false);
      return;
    }

    if (inputs.password.trim().length < 6) {
      setErrors({ ...errors, passwordError: true });
      setLoading(false);
      return;
    }

    const myData = {
      data: {
        type: "token",
        attributes: { email: inputs.email, password: inputs.password },
      },
    };

    try {
      const response = await AuthService.login(myData);

      notification.success({
        message: "Sign in successful!",
        description: "You have signed in successfully.",
        placement: "topRight",
      });
      console.log(response.token, "response");
      
      authContext.login(response.token, response.refresh_token);
    } catch (res) {
      if (res?.message) {
        setCredentialsError(res.message);
      } else if (Array.isArray(res?.errors) && res.errors.length > 0) {
        setCredentialsError(res.errors[0].detail);
      } else {
        setCredentialsError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
      setInputs({ email: "", password: "" });
      setErrors({ emailError: false, passwordError: false });
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenParam = queryParams.get("token");
    const shopIdParam = queryParams.get("shopId");
    setToken(tokenParam);
    setShopId(shopIdParam);

    const sendDataToBackend = async () => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}api/v1/auth/loginAsAdmin`, {
          token: tokenParam,
          shopId: shopIdParam,
        });
        
        authContext.login(response.data.access_token, response.data.refresh_token);
      } catch (error) {
        console.error("Error sending data to backend:", error);
      }
    };

    if (tokenParam && shopIdParam) {
      sendDataToBackend();
    }
  }, [authContext]);

  return (
    <BasicLayoutLanding image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Sign in
          </MDTypography>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" method="POST" onSubmit={submitHandler}>
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email"
                fullWidth
                value={inputs.email}
                name="email"
                onChange={changeHandler}
                error={errors.emailError}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label="Password"
                fullWidth
                name="password"
                value={inputs.password}
                onChange={changeHandler}
                error={errors.passwordError}
              />
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={handleSetRememberMe} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={handleSetRememberMe}
                sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;Remember me
              </MDTypography>
            </MDBox>
            <MDBox mt={4} mb={1}>
              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </MDButton>
            </MDBox>
            {credentialsErrors && (
              <MDTypography variant="caption" color="error" fontWeight="light">
                {credentialsErrors}
              </MDTypography>
            )}
            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                if you don't have register...{" "}
                <MDTypography
                  component={Link}
                  to="/auth/register"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  Sign Up
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayoutLanding>
  );
}

export default Login;
