import React, { useEffect, useRef, useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import Editor from "./Editor";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import axios from "axios";
import slugify from "slugify";

const UpdateHistoryComponent = ({ history }) => {
  const [readOnly, setReadOnly] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const quillRef = useRef();
  const token = import.meta.env.VITE_ADMIN_TOKEN;
  const imageUrl = import.meta.env.VITE_BASE_IMAGE_URL;
  const imageUploadUrl = import.meta.env.VITE_BASE_IMAGE_UPLOAD_URL;
  const [previewUrl, setPreviewUrl] = useState(
    history.thumbnail ? `${imageUrl}${history.thumbnail}` : ""
  );

  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.innerHTML = history.body;
    }
  }, [history.body]);

  const initialValues = {
    slug: history.slug,
    title: history.title,
    contentType: history.content_type,
    thumbnail: history.thumbnail,
    body: history.body,
    is_draft: false,
  };

  const validationSchema = Yup.object({
    slug: Yup.string().required("Required"),
    title: Yup.string().required("Required"),
    thumbnail: Yup.string().required("Required"),
    is_draft: Yup.boolean().required("Required"),
  });

  const handleFileChange = async (event, setFieldValue) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await axios.post(imageUploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.data.file) {
        setFieldValue("thumbnail", response.data.data.file);
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

    const payload = {
      slug: values.slug,
      title: values.title,
      content_type: values.contentType,
      thumbnail: values.thumbnail,
      body: descriptionContent,
      is_draft: values.is_draft,
    };

    try {
      const response = await fetch(
        `http://136.228.158.126:50003/api/contents/${history.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Network response was not ok: ${errorText}`);
        throw new Error(`Network response was not ok: ${errorText}`);
      }

      console.log("Content saved successfully");
      setShowSuccessModal(true);
      resetForm();
      editor.setText("");
      document.getElementById("thumbnail").value = "";
    } catch (error) {
      console.error("Failed to save content", error);
      setShowFailModal(true);
    }
  };

  return (
    <div className="mt-0">
      <label htmlFor="body" className="block text-lg font-semibold mb-1">
        Body
      </label>
      <Editor ref={quillRef} readOnly={readOnly} />
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSave}
      >
        {({ setFieldValue, handleChange }) => (
          <Form>
            <div className="form-group">
              <label
                htmlFor="title"
                className="block text-gray-700 font-medium mt-3"
              >
                Title
              </label>
              <Field
                id="title"
                name="title"
                type="text"
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
                className="border border-gray-300 p-2 rounded-md w-full"
              />
              <ErrorMessage
                name="title"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div className="form-group">
              <label
                htmlFor="slug"
                className="block text-gray-700 font-medium mt-3"
              >
                Slug
              </label>
              <Field
                id="slug"
                name="slug"
                type="text"
                className="border border-gray-300 p-2 rounded-md w-full"
              />
              <ErrorMessage
                name="slug"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div className="form-group">
              <label
                htmlFor="contentType"
                className="block text-gray-700 font-medium mb-1"
              >
                Sport Category ID
              </label>
              <Field
                as="select"
                name="contentType"
                className="border border-gray-300 p-2 rounded-md w-full"
              >
                <option value="">Select a category</option>
                <option value="history-of-bokator">History-Of-Bokator</option>
                <option value="history-of-kun-khmer">
                  History-Of-Kun-Khmer
                </option>
                <option value="history-of-volleyball">
                  History-Of-Volleyball
                </option>
                <option value="history-of-football">History-Of-Football</option>
              </Field>
              <ErrorMessage
                name="contentType"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div className="form-group">
              <label
                htmlFor="thumbnail"
                className="block text-gray-700 font-medium mt-3"
              >
                Thumbnail
              </label>
              <input
                id="thumbnail"
                name="thumbnail"
                type="file"
                onChange={(event) => handleFileChange(event, setFieldValue)}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
              />
              {previewUrl && (
                <div className="mt-2 flex items-center justify-center border border-gray-300 rounded-lg p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <img
                    src={previewUrl}
                    alt="image preview"
                    className="h-[230px] object-cover rounded-lg"
                  />
                </div>
              )}
              {uploading && <p>Uploading...</p>}
              <ErrorMessage
                name="thumbnail"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div className="form-group flex gap-1">
              <Field
                id="is_draft"
                name="is_draft"
                type="checkbox"
                className="border border-gray-300 p-2 rounded-md mt-3"
              />
              <ErrorMessage
                name="is_draft"
                component="div"
                className="text-red-500 text-sm"
              />
              <label
                htmlFor="is_draft"
                className="block text-gray-700 font-medium mt-3"
              >
                Is Draft
              </label>
            </div>
            <div className="col-span-1 md:col-span-3 mt-0">
              <button
                type="submit"
                className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md"
              >
                Save
              </button>
            </div>
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
                      History updated successfully.
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

export default UpdateHistoryComponent;
