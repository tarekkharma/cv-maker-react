import React, { useState } from "react";
import useUser from "../hooks/useUser";
import { AnimatePresence } from "framer-motion";
import { MainSpinner, TemplateDesignPin } from "../components";
import useTemplates from "../hooks/useTemplates";
import { NoData } from "../assets";
import { useQuery } from "react-query";
import { getSavedResumes } from "../api";

const UserProfile = () => {
  const { data: user } = useUser();
  const [activeTab, setActiveTab] = useState("");
  //const navigate = useNavigate();

  const {
    data: templates,
    isLoading: temp_isLoading,
    isError: temp_isError,
  } = useTemplates();

  const { data: savedResumes } = useQuery(["savedResumes"], () =>
    getSavedResumes(user?.uid)
  );

  /* useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, []);*/

  if (temp_isLoading) {
    return <MainSpinner />;
  }

  return (
    <div className="w-full flex flex-col items-center justify-start py-12">
      <div className="w-full h-72 bg-blue-50">
        <img
          src="https://wallpapercave.com/wp/wp1904062.jpg"
          className="w-full h-full object-cover"
          alt=""
        />
        <div className="flex flex-col items-center justify-center gap-4">
          {user?.photoURLs ? (
            <React.Fragment>
              <img
                src={user?.photoURL}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full border-2 border-white -mt-12 shadow-md"
                alt=""
                loading="lazy"
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <img
                src="https://static.vecteezy.com/ti/gratis-vektor/p3/26434409-standard-avatar-profil-icon-social-media-benutzerfoto-vektor.jpg"
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full border-2 border-white -mt-12 shadow-md"
                alt=""
                loading="lazy"
              />
            </React.Fragment>
          )}
          <p className="text-2xl text-txtDark">{user?.displayName}</p>
        </div>
        {/**tabs */}
        <div className="flex items-center justify-center mt-12">
          <div
            className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 group cursor-pointer`}
            onClick={() => setActiveTab("collections")}
          >
            <p
              className={`text-base text-txtPrimary group-hover:text-blue-600 px-4 py-1 rounded-full ${
                activeTab === "collections" &&
                "bg-white shadow-md text-blue-600"
              }`}
            >
              Collections
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 group cursor-pointer`}
            onClick={() => setActiveTab("resumes")}
          >
            <p
              className={`text-base text-txtPrimary group-hover:text-blue-600 px-4 py-1 rounded-full ${
                activeTab === "resumes" && "bg-white shadow-md text-blue-600"
              }`}
            >
              My Resumes
            </p>
          </div>
        </div>

        {/**tab content */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 px-4 py-6">
          <AnimatePresence>
            {activeTab === "collections" && (
              <React.Fragment>
                {user?.collections.length > 0 && user?.collections ? (
                  <RenderATemplate
                    templates={templates.filter((temp) =>
                      user?.collections?.includes(temp?._id)
                    )}
                  />
                ) : (
                  <div className="col-span-12 w-full flex flex-col items-center justify-center gap-3">
                    <img
                      src={NoData}
                      className="w-32 h-auto object-contain"
                      alt=""
                    />
                    <p>No data</p>
                  </div>
                )}
              </React.Fragment>
            )}

            {activeTab === "resumes" && (
              <React.Fragment>
                {savedResumes?.length > 0 && savedResumes ? (
                  <RenderATemplate templates={savedResumes} />
                ) : (
                  <div className="col-span-12 w-full flex flex-col items-center justify-center gap-3">
                    <img
                      src={NoData}
                      className="w-32 h-auto object-contain"
                      alt=""
                    />
                    <p>No data</p>
                  </div>
                )}
              </React.Fragment>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const RenderATemplate = ({ templates }) => {
  return (
    <React.Fragment>
      {templates && templates.length > 0 && (
        <React.Fragment>
          <AnimatePresence>
            {templates &&
              templates.map((template, index) => (
                <TemplateDesignPin
                  key={template?._id}
                  data={template}
                  index={index}
                />
              ))}
          </AnimatePresence>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default UserProfile;
