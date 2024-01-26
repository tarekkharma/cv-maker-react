import React, { useState } from "react";
import { FaTrash, FaUpload } from "react-icons/fa6";
import { PuffLoader } from "react-spinners";
import { toast } from "react-toastify";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "../config/firebase.config";
import { initialTags } from "../utils/helpers";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import useTemplates from "../hooks/useTemplates";

const CreateTemplate = () => {
  const [formData, setFormData] = useState({ title: "", imageURL: null });
  const [imageAsset, setImageAsset] = useState({
    isImageLoading: false,
    uri: null,
    progress: 0,
  });
  const [selectedTags, setSelectedTags] = useState([]);

  const {
    data: templates,
    isError: templatesIsError,
    isLoading: templatesIsLoading,
    refetch: templatesRefetch,
  } = useTemplates();

  // handling the input field change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // handling the image file change

  const handleFileSelect = async (e) => {
    setImageAsset((prev) => ({ ...prev, isImageLoading: true }));
    const file = e.target.files[0];

    if (file && isAllowed(file)) {
      const storageRef = ref(storage, `Templates/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          setImageAsset((prev) => ({
            ...prev,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          }));
        },
        (error) => {
          if (error.message.includes("storage/unauthorized")) {
            toast.error(`Eroor : Authorization Revoked`);
          } else {
            toast.error(`Eroor : ${error.message}`);
          }
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadUrl) => {
            setImageAsset((prev) => ({ ...prev, uri: downloadUrl }));
          });
          toast.success("Image Uploaded");
          setInterval(() => {
            setImageAsset((prev) => ({
              ...prev,
              isImageLoading: false,
            }));
          }, 2000);
        }
      );
    } else {
      toast.info("Invalid File Format");
    }
  };

  // delete an image from the cloud

  const deleteImageObject = async () => {
    setInterval(() => {
      setImageAsset((prev) => ({
        ...prev,
        progress: 0,
        uri: null,
      }));
    }, 2000);
    const deleteRef = ref(storage, imageAsset.uri);
    deleteObject(deleteRef).then(() => {
      toast.success("Image Removed");
    });
  };

  const isAllowed = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    return allowedTypes.includes(file.type);
  };

  const handleSelectedTags = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((selected) => selected !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const pushToCloud = async () => {
    const timestamp = serverTimestamp();
    const id = `${Date.now()}`;
    const _doc = {
      _id: id,
      title: formData.title,
      imageURL: imageAsset.uri,
      tags: selectedTags,
      name:
        templates && templates.length > 0
          ? `Template${templates.length + 1}`
          : "Template1",
      timestamp: timestamp,
    };
    await setDoc(doc(db, "templates", id), _doc)
      .then(() => {
        setFormData((prev) => ({ ...prev, title: "", imageURL: "" }));
        setImageAsset((prev) => ({ ...prev, uri: null }));
        setSelectedTags([]);
        templatesRefetch();
        toast.success("Data pushed to the cloud");
      })
      .catch((error) => {
        toast.error(`Error : ${error.message}`);
      });
  };

  //remove template data from cloud

  const removeTemplate = async (template) => {
    const deleteRef = ref(storage, template?.imageURL);
    await deleteObject(deleteRef).then(async () => {
      await deleteDoc(doc(db, "templates", template?._id))
        .then(() => {
          toast.success("Template deleted from the cloud");
          templatesRefetch();
        })
        .catch((err) => {
          toast.error(`Error : ${err.message}`);
        });
    });
  };

  return (
    <div className="w-full px-4 lg:px-10 2xl:px-32 grid grid-cols-1 lg:grid-cols-12">
      {/* left container */}
      <div className="col-span-12 lg:col-span-4 2xl:col-span-3 w-full flex flex-1 items-center justify-start flex-col gap-4 px-2">
        <div className="w-full">
          <p className="text-lg text-txtPrimary">Create a new Template</p>
        </div>

        {/* template id section */}

        <div className="w-full flex items-center justify-end">
          <p className="text-base text-txtLight uppercase font-semibold">
            TempID :
          </p>
          <p className="text-sm text-txtDark capitalize font-bold">
            {templates && templates.length > 0
              ? `Template${templates.length + 1}`
              : "Template1"}
          </p>
        </div>
        {/* template title section */}
        <input
          className="w-full px-4 py-3 rounded-md bg-transparent border border-gray-300 text-lg text-txtPrimary focus:text-txtDark focus:shadow-md outline-none"
          type="text"
          name="title"
          placeholder="Template Title"
          value={formData.title}
          onChange={handleInputChange}
        />

        {/* file uploader section */}
        <div className="w-full bg-gray-100 backdrop-blur-md h-[420px] lg:h-[620px] 2xl:h-[740px] rounded-md border-2 border-dotted border-gray-300 cursor-pointer flex items-center justify-center">
          {imageAsset.isImageLoading ? (
            <React.Fragment>
              <div className="flex flex-col items-center justify-center gap-4 ">
                <PuffLoader color="#498FCD" size={40} />
                <p>{imageAsset?.progress.toFixed(2)}%</p>
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              {!imageAsset?.uri ? (
                <React.Fragment>
                  <label className="w-full cursor-pointer h-full">
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <div className="flex items-center justify-center cursor-pointer flex-col gap-4">
                        <FaUpload className="text-2xl" />
                        <p className="text-lg text-txtLight">Click to upload</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="w-0 h-0"
                      accept=".jpeg,.jpg,.png"
                      onChange={handleFileSelect}
                    />
                  </label>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className="relative w-full h-full overflow-hidden rounded-md">
                    <img
                      src={imageAsset?.uri}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      alt=""
                    />

                    {/* delete action */}
                    <div
                      className="absolute top-4 right-4 h-8 w-8 rounded-md flex items-center justify-center bg-red-500 cursor-pointer"
                      onClick={deleteImageObject}
                    >
                      <FaTrash className="text-sm text-white" />
                    </div>
                  </div>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </div>
        {/* tags */}

        <div className="w-full flex items-center flex-wrap gap-2">
          {initialTags.map((tag, i) => (
            <div
              key={i}
              className={`border border-gray-300 px-2 py-1 rounded-md cursor-pointer ${
                selectedTags.includes(tag) ? "bg-blue-500 text-white" : ""
              } `}
              onClick={() => handleSelectedTags(tag)}
            >
              <p className="text-xs">{tag}</p>
            </div>
          ))}
        </div>
        {/* button action */}
        <button
          type="button"
          className="w-full bg-blue-700 text-white rounded-md py-3"
          onClick={pushToCloud}
        >
          Save
        </button>
      </div>
      {/* right container */}
      <div className="col-span-12 lg:col-span-8 2xl:col-span-9 w-full px-2 flex-1 py-4 ">
        {templatesIsLoading ? (
          <React.Fragment>
            <div className="flex items-center justify-center w-full h-full ">
              <PuffLoader color="#498FCD" size={40} />
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            {templates && templates.length > 0 ? (
              <React.Fragment>
                <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
                  {templates?.map((template) => (
                    <div
                      key={template._id}
                      className="w-full h-[500px] rounded-md overflow-hidden relative"
                    >
                      <img
                        src={template?.imageURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {/* delete action */}
                      <div
                        className="absolute top-4 right-4 h-8 w-8 rounded-md flex items-center justify-center bg-red-500 cursor-pointer"
                        onClick={() => removeTemplate(template)}
                      >
                        <FaTrash className="text-sm text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div className="flex flex-col gap-6 items-center justify-center w-full h-full ">
                  <PuffLoader color="#498FCD" size={40} />
                  <p className="text-xl tracking-wider capitalize text-txtPrimary">
                    No Data
                  </p>
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default CreateTemplate;
