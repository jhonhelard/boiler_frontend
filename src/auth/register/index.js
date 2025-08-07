import { useState, useEffect } from "react";
// react-router-dom components
import { Link, useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";

// Images
import bgImage from "assets/images/bg-sign-up-cover.jpeg";

import AuthService from "services/auth-service";
import CityService from "services/city-service";
import { InputLabel } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setRegions, setRegionsLoading, setRegionsError } from "../../redux/regions";
import { notification } from "antd";

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: cities, loading: citiesLoading, error: citiesError } = useSelector((state) => state.regions);

  const [showPassword, setShowPassword] = useState(false);
  const [inputs, setInputs] = useState({
    name: "",
    last_name: "",
    email: "",
    password: "",
    region: "",
  });

  // Fetch cities when component mounts
  useEffect(() => {
    const fetchCities = async () => {
      try {
        dispatch(setRegionsLoading(true));
        const response = await CityService.getAllCities();
        dispatch(setRegions(response));
      } catch (error) {
        console.error('Error fetching cities:', error);
        dispatch(setRegionsError(error.message || 'Failed to fetch cities'));
      }
    };

    fetchCities();
  }, [dispatch]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const [errors, setErrors] = useState({
    nameError: false,
    last_nameError: false,
    emailError: false,
    passwordError: false,
    regionError: false,
    error: false,
    errorText: "",
  });

  const changeHandler = (e) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (inputs.name.trim().length === 0) {
      setErrors({ ...errors, nameError: true });
      return;
    }

    if (inputs.email.trim().length === 0 || !inputs.email.trim().match(mailFormat)) {
      setErrors({ ...errors, emailError: true });
      return;
    }

    if (inputs.password.trim().length < 8) {
      setErrors({ ...errors, passwordError: true });
      return;
    }

    if (!inputs.region) {
      setErrors({ ...errors, regionError: true });
      return;
    }

    // here will be the post action to add a user to the db
    const newUser = {
      first_name: inputs.name,
      last_name: inputs.last_name,
      email: inputs.email,
      password: inputs.password,
      region: inputs.region,
      is_owner: true
    };

    const myData = {
      data: {
        type: "users",
        attributes: { ...newUser, password_confirmation: newUser.password, is_owner: true },
        relationships: {
          roles: {
            data: [
              {
                type: "roles",
                id: "1",
              },
            ],
          },
        },
      },
    };

    try {
      const response = await AuthService.register(myData);
      
      // Show success notification
      notification.success({
        message: 'Registration Successful!',
        description: 'Your account has been created successfully. Redirecting to login page...',
        placement: 'topRight',
        duration: 3,
      });
      
      setInputs({
        name: "",
        last_name: "",
        email: "",
        password: "",
        region: "",
      });

      setErrors({
        nameError: false,
        last_nameError: false,
        emailError: false,
        passwordError: false,
        regionError: false,
        error: false,
        errorText: "",
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err) {
      // Check if it's an "already registered" error
      if (err.message && err.message.toLowerCase().includes('already registered')) {
        notification.error({
          message: 'User Already Registered',
          description: 'An account with this email already exists. Please try logging in instead.',
          placement: 'topRight',
          duration: 5,
        });
      } else {
        notification.error({
          message: 'Registration Failed',
          description: err.message || 'An error occurred during registration. Please try again.',
          placement: 'topRight',
          duration: 4,
        });
      }
      
      setErrors({ ...errors, error: true, errorText: err.message });
      console.error(err);
    }
  };

  return (
    <CoverLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="success"
          mx={2}
          mt={-3}
          p={3}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Join us today
          </MDTypography>
          <MDTypography display="block" variant="button" color="white" my={1}>
            Enter your email and password to register
          </MDTypography>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" method="POST" onSubmit={submitHandler}>
            <MDBox mb={2}>
              <MDInput
                type="text"
                label="First Name"
                variant="standard"
                fullWidth
                name="name"
                value={inputs.name}
                onChange={changeHandler}
                error={errors.nameError}
                inputProps={{
                  autoComplete: "name",
                  form: {
                    autoComplete: "off",
                  },
                }}
              />
              {errors.nameError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  The name can not be empty
                </MDTypography>
              )}
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="text"
                label="Last Name"
                variant="standard"
                fullWidth
                name="last_name"
                value={inputs.last_name}
                onChange={changeHandler}
                error={errors.last_nameError}
                inputProps={{
                  autoComplete: "name",
                  form: {
                    autoComplete: "off",
                  },
                }}
              />
              {errors.last_nameError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  The name can not be empty
                </MDTypography>
              )}
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email"
                variant="standard"
                fullWidth
                value={inputs.email}
                name="email"
                onChange={changeHandler}
                error={errors.emailError}
                inputProps={{
                  autoComplete: "email",
                  form: {
                    autoComplete: "off",
                  },
                }}
              />
              {errors.emailError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  The email must be valid
                </MDTypography>
              )}
            </MDBox>
            <MDBox mb={2} display="flex" alignItems="center">
              <MDInput
                type={showPassword ? "text" : "password"}
                label="Password"
                variant="standard"
                fullWidth
                name="password"
                value={inputs.password}
                onChange={changeHandler}
                error={errors.passwordError}
              />
              <IconButton
                onClick={togglePasswordVisibility}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
              {errors.passwordError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  The password must be of at least 8 characters
                </MDTypography>
              )}
            </MDBox>
            <MDBox mb={2}>
              <FormControl fullWidth variant="standard">
                <InputLabel id="region-select-label">Region</InputLabel>
                <Select
                  labelId="region-select-label"
                  name="region"
                  value={inputs.region}
                  onChange={changeHandler}
                  error={errors.regionError}
                  disabled={citiesLoading}
                >
                  <MenuItem value="">
                    <em>Select a region</em>
                  </MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city._id} value={city._id}>
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {errors.regionError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  Please select a region
                </MDTypography>
              )}
              {citiesLoading && (
                <MDTypography variant="caption" color="text" fontWeight="light">
                  Loading regions...
                </MDTypography>
              )}
              {citiesError && (
                <MDTypography variant="caption" color="error" fontWeight="light">
                  {citiesError}
                </MDTypography>
              )}
            </MDBox>

            {errors.error && (
              <MDTypography variant="caption" color="error" fontWeight="light">
                {errors.errorText}
              </MDTypography>
            )}
            <MDBox mt={4} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth type="submit">
                sign up
              </MDButton>
            </MDBox>
            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                Already have an account?{" "}
                <MDTypography
                  component={Link}
                  to="/auth/login"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  Sign In
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </CoverLayout>
  );
}

export default Register;
