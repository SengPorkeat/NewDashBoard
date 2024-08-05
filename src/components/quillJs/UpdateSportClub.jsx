import React, { useRef, useState, useEffect } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import Editor from "./Editor";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import { NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import slugify from "slugify";

const UpdateSportClub = () => {
  // const [readOnly, setReadOnly] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const location = useLocation();
  const { clubs } = location.state || {};
  const imageUrl = import.meta.env.VITE_BASE_IMAGE_URL;
  const imageUploadUrl = import.meta.env.VITE_BASE_IMAGE_UPLOAD_URL;
  const [previewUrl, setPreviewUrl] = useState(
    clubs.image ? `${imageUrl}${clubs.image}` : ""
  );

  const quillRef = useRef();
  const token = import.meta.env.VITE_ADMIN_TOKEN;

  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.innerHTML = clubs.description;
    }
  }, [clubs.description]);

  console.log("Club data:", clubs);

  const initialValues = {
    sportCategory: clubs.sport_category,
    slug: clubs.slug,
    sportName: clubs.sport_name,
    location: `${clubs.latitude},${clubs.longitude}`,
    latitude: clubs.latitude,
    longitude: clubs.longitude,
    seatNumber: clubs.seat_number,
    skillLevel: clubs.skill_level,
    description: clubs.description,
    image: clubs.image,
    reviews: clubs.reviews,
    profile: clubs.profile,
    cover: clubs.cover,
    price: clubs.price,
    firstPhone: clubs.contact_info.first_phone,
    secondPhone: clubs.contact_info.second_phone,
    email: clubs.contact_info.email,
    website: clubs.contact_info.website,
    facebook: clubs.contact_info.facebook,
    telegram: clubs.contact_info.telegram,
    instagram: clubs.contact_info.instagram,
    twitter: clubs.contact_info.twitter,
    istadAccount: clubs.contact_info.istad_account,
  };
  console.log("Image:", clubs.image);

  const validationSchema = Yup.object({
    sportCategory: Yup.string().required("Sport Category is required."),
    slug: Yup.string().required("Slug is required."),
    sportName: Yup.string().required("Sport Name is required."),
    location: Yup.string().required("Location is required."),
    seatNumber: Yup.number().required("Seat Number is required."),
    skillLevel: Yup.string().required("Skill Level is required."),
    price: Yup.string().required("Price is required."),
  });

  // handleFileChange
  const handleFileChange = async (event, setFieldValue) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await axios.post(imageUploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${import.meta.env.VITE_ADMIN_TOKEN}`, // Ensure token is correctly set
        },
      });

      // Adjust this line according to the actual response structure
      if (response.data.data.file) {
        setFieldValue("image", response.data.data.file);
        const url = `${imageUrl}${response.data.data.file}`;
        setPreviewUrl(url);
      } else {
        console.error("URL not found in response:", response.data.data.file);
      }

      setUploading(false);
    } catch (error) {
      setUploading(false);
      console.error("Error uploading file:", error);
    }
  };

  const handleSave = async (values, { resetForm }) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) {
      console.error("Editor instance not available.");
      return;
    }

    const descriptionContent = editor.root.innerHTML;
    if (!descriptionContent) {
      console.error("Description content is empty.");
      return;
    }

    // const slug = slugify(values.sportName, { lower: true });
    const slug = slugify(values.sportName, {
      replacement: "-",
      lower: true,
      strict: true,
      trim: true,
    });

    const payload = {
      sport_category: values.sportCategory,
      slug: slug,
      sport_name: values.sportName,
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
      seat_number: parseInt(values.seatNumber, 10),
      skill_level: values.skillLevel,
      description: descriptionContent,
      image: values.image,
      reviews: values.reviews,
      profile: values.profile,
      cover: values.cover,
      price: values.price,
      contact_info: {
        first_phone: values.firstPhone,
        second_phone: values.secondPhone,
        email: values.email,
        website: values.website,
        facebook: values.facebook,
        telegram: values.telegram,
        instagram: values.instagram,
        twitter: values.twitter,
        istad_account: values.istadAccount,
      },
    };

    console.log("Payload:", payload);

    try {
      const response = await fetch(
        `http://136.228.158.126:50003/api/sportclubs/${clubs.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      console.log("Update sport club with ID:", clubs.id);
      console.log("id in UpdateSportCLub: ", values.id);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Network response was not ok: ${errorText}`);
        throw new Error(`Network response was not ok: ${errorText}`);
      }

      console.log("Content saved successfully");
      setShowSuccessModal(true);
      resetForm({
        values: {
          sportCategory: "",
          slug: "",
          sportName: "",
          location: "",
          latitude: "",
          longitude: "",
          seatNumber: "",
          skillLevel: "",
          description: "",
          image: "",
          reviews: "",
          profile: "",
          cover: "",
          price: "",
          firstPhone: "",
          secondPhone: "",
          email: "",
          website: "",
          facebook: "",
          telegram: "",
          instagram: "",
          twitter: "",
          istadAccount: "",
        },
      });

      editor.setText("");
      document.getElementById("image").value = "";
    } catch (error) {
      console.error("Failed to save content", error);
      setShowFailModal(true);
    }
  };

  return (
    <div className="mt-0 w-11/12 mx-auto">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSave}
      >
        {({ setFieldValue, handleChange }) => (
          <Form className="form mt-6 space-y-4">
            {/* Description Editor */}
            <div className="form-group">
              <label
                htmlFor="description"
                className="block text-lg font-semibold mb-2"
              >
                Description
              </label>
              <Editor ref={quillRef} />
            </div>
            <div className="grid grid-cols-5 gap-5">
              {/* Sport Category Select */}
              <div className="form-group">
                <label
                  htmlFor="sportCategory"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Sport Category ID
                </label>
                <Field
                  as="select"
                  name="sportCategory"
                  className="border border-gray-300 p-2 rounded-md w-full"
                >
                  <option value="">Select a category</option>
                  <option value="b4686c69-a4fb-4284-9a0c-8c8e271836f3">
                    Football
                  </option>
                  <option value="f4c3597b-2155-4c63-9a7a-5dea3434ccaa">
                    Basketball
                  </option>
                  <option value="2fe56924-fe8a-4ccd-8792-432fe3885692">
                    Volleyball
                  </option>
                  <option value="6da6376b-932a-4f5c-a7aa-c70dacd7b705">
                    Badminton
                  </option>
                </Field>
                <ErrorMessage
                  name="sportCategory"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Slug Input */}
              <div className="form-group">
                <label
                  htmlFor="slug"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Slug
                </label>
                <Field
                  name="slug"
                  type="text"
                  placeholder="Enter slug"
                  className="border border-gray-300 p-2 rounded-md w-full"
                />
                <ErrorMessage
                  name="slug"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
              {/* Sport Name Input */}
              <div className="form-group">
                <label
                  htmlFor="sportName"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Sport Name
                </label>
                <Field
                  name="sportName"
                  type="text"
                  placeholder="Enter sport name"
                  className="border border-gray-300 p-2 rounded-md w-full"
                  onChange={(e) => {
                    handleChange(e);
                    const newSlug = slugify(e.target.value, {
                      replacement: "-",
                      lower: true,
                      strict: true,
                      trim: true,
                    });
                    setFieldValue("slug", newSlug);
                  }}
                />
                <ErrorMessage
                  name="sportName"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
              {/* Latitude and Longitude Combined Input */}
              <div className="form-group">
                <label
                  htmlFor="location"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Location
                </label>
                <Field
                  name="location"
                  type="text"
                  placeholder="Enter latitude,longitude"
                  className="border border-gray-300 p-2 rounded-md w-full"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Split value by comma and set separate fields
                    const [lat, lon] = value
                      .split(",")
                      .map((val) => val.trim());
                    setFieldValue("latitude", lat || "");
                    setFieldValue("longitude", lon || "");
                    setFieldValue("location", value);
                  }}
                />
                <ErrorMessage
                  name="location"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
              {/* Seat Number Input */}
              <div className="form-group">
                <label
                  htmlFor="seatNumber"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Seat Number
                </label>
                <Field
                  name="seatNumber"
                  type="text"
                  placeholder="Enter seat number"
                  className="border border-gray-300 p-2 rounded-md w-full"
                />
                <ErrorMessage
                  name="seatNumber"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-5">
              {/* Skill Level Input */}
              <div className="form-group">
                <label
                  htmlFor="skillLevel"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Skill Level
                </label>
                <Field
                  name="skillLevel"
                  type="text"
                  placeholder="Enter skill level"
                  className="border border-gray-300 p-2 rounded-md w-full"
                />
                <ErrorMessage
                  name="skillLevel"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Reviews Input */}
              <div className="form-group">
                <label
                  htmlFor="reviews"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Reviews
                </label>
                <Field
                  name="reviews"
                  type="text"
                  placeholder="Enter reviews"
                  className="border border-gray-300 p-2 rounded-md w-full"
                />
                <ErrorMessage
                  name="reviews"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Profile Input */}
              <div className="form-group">
                <label
                  htmlFor="profile"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Profile
                </label>
                <Field
                  name="profile"
                  type="text"
                  placeholder="Enter profile"
                  className="border border-gray-300 p-2 rounded-md w-full"
                />
                <ErrorMessage
                  name="profile"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
              {/* Cover Input */}
              <div className="form-group">
                <label
                  htmlFor="cover"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Cover
                </label>
                <Field
                  name="cover"
                  type="text"
                  placeholder="Enter cover"
                  className="border border-gray-300 p-2 rounded-md w-full"
                />
                <ErrorMessage
                  name="cover"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>

              {/* Price Input */}
              <div className="form-group">
                <label
                  htmlFor="price"
                  className="block text-gray-700 font-medium mb-1"
                >
                  Price
                </label>
                <Field
                  name="price"
                  type="text"
                  placeholder="Enter price"
                  className="border border-gray-300 p-2 rounded-md w-full"
                />
                <ErrorMessage
                  name="price"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
            </div>

            {/* Contact Information Inputs */}
            <h3 className="text-lg font-semibold mt-4">Contact Information</h3>
            <section className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-5">
                <div className="form-group">
                  <label
                    htmlFor="firstPhone"
                    className="block text-gray-700 font-medium mb-1"
                  >
                    First Phone
                  </label>
                  <Field
                    name="firstPhone"
                    type="text"
                    placeholder="Enter first phone number"
                    className="border border-gray-300 p-2 rounded-md w-full"
                  />
                  <ErrorMessage
                    name="firstPhone"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div className="form-group">
                  <label
                    htmlFor="secondPhone"
                    className="block text-gray-700 font-medium mb-1"
                  >
                    Second Phone
                  </label>
                  <Field
                    name="secondPhone"
                    type="text"
                    placeholder="Enter second phone number"
                    className="border border-gray-300 p-2 rounded-md w-full"
                  />
                  <ErrorMessage
                    name="secondPhone"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div className="form-group">
                  <label
                    htmlFor="email"
                    className="block text-gray-700 font-medium mb-1"
                  >
                    Email
                  </label>
                  <Field
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    className="border border-gray-300 p-2 rounded-md w-full"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div className="form-group">
                  <label
                    htmlFor="website"
                    className="block text-gray-700 font-medium mb-1"
                  >
                    Website
                  </label>
                  <Field
                    name="website"
                    type="url"
                    placeholder="Enter website URL"
                    className="border border-gray-300 p-2 rounded-md w-full"
                  />
                  <ErrorMessage
                    name="website"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div className="form-group">
                  <label
                    htmlFor="facebook"
                    className="block text-gray-700 font-medium mb-1"
                  >
                    Facebook
                  </label>
                  <Field
                    name="facebook"
                    type="url"
                    placeholder="Enter Facebook URL"
                    className="border border-gray-300 p-2 rounded-md w-full"
                  />
                  <ErrorMessage
                    name="facebook"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div className="form-group">
                  <label
                    htmlFor="telegram"
                    className="block text-gray-700 font-medium mb-1"
                  >
                    Telegram
                  </label>
                  <Field
                    name="telegram"
                    type="url"
                    placeholder="Enter Telegram URL"
                    className="border border-gray-300 p-2 rounded-md w-full"
                  />
                  <ErrorMessage
                    name="telegram"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Image URL Input */}
            <div className="form-group">
              <label
                htmlFor="image"
                className="block text-gray-700 font-medium mb-1"
              >
                Image
              </label>
              <input
                id="image"
                type="file"
                name="image"
                onChange={(event) => handleFileChange(event, setFieldValue)}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              />
              {/* Container for the image preview */}
              <div className="mt-2 flex items-center justify-center border border-gray-300 rounded-lg p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="image preview"
                    className="h-[230px] object-cover rounded-lg"
                  />
                )}
              </div>
              {uploading && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Uploading...
                </p>
              )}
              <ErrorMessage
                name="image"
                component="div"
                className="text-red-500 text-sm mt-2"
              />
            </div>
            {/* Submit Button */}
            <section className="flex gap-2">
              <div className="form-group">
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded-md"
                >
                  Save
                </button>
              </div>
              <div className="form-group">
                <NavLink to="/sport-club">
                  <button
                    type="submit"
                    className="bg-red-500 text-white py-2 px-4 rounded-md"
                  >
                    Cancel
                  </button>
                </NavLink>
              </div>
            </section>
          </Form>
        )}
      </Formik>

      {/* success modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    Success
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      News updated successfully.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fail Modal */}
      {showFailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-8 max-w-lg rounded-md shadow-lg relative">
            <button
              onClick={() => setShowFailModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
            <div className="w-12 h-12 rounded-full bg-red-100 p-2 flex items-center justify-center mx-auto mb-3.5">
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 7.586l4.293-4.293a1 1 0 111.414 1.414L11.414 9l4.293 4.293a1 1 0 01-1.414 1.414L10 10.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 9 4.293 4.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>

              <span className="sr-only">Failed</span>
            </div>
            <p className="text-lg font-semibold mb-8 text-gray-900">
              Fail to create Sport Club!
            </p>
            <button
              onClick={() => setShowFailModal(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md absolute bottom-4 left-1/2 transform -translate-x-1/2"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateSportClub;
