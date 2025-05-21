import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";

const HomePage = () => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  // Function to create a new project
  function createProject(e) {
    e.preventDefault();
    console.log({ projectName });

    axios.post('/projects/create', {
      name: projectName,
      
    })
      .then((res) => {
        console.log(res);
        setIsModalOpen(false);
        setProjectName("");
        // Refresh projects after creation
        fetchProjects();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // Function to fetch all projects
  const fetchProjects = () => {
    axios.get('/projects/all')
      .then((res) => {
        // Filter projects to only show ones where the current user is a member
        const userProjects = res.data.projects.filter(project => 
          project.users.some(projectUser => projectUser === user._id || projectUser._id === user._id)
        );
        setProjects(userProjects);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []); // Empty dependency array to run only on mount

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Projects Dashboard</h1>
            <div className="flex items-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i className="ri-add-line mr-2"></i>
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="ri-folder-line text-6xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new project</p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i className="ri-add-line mr-2"></i>
                New Project
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">Your Projects</h2>
              <p className="text-sm text-gray-500">Select a project to view details or create a new one</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div 
                onClick={() => setIsModalOpen(true)}
                className="relative bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col items-center justify-center h-48"
              >
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <i className="ri-add-line text-2xl text-blue-600"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">New Project</h3>
                <p className="text-sm text-gray-500 mt-1">Create a new workspace</p>
              </div>

              {projects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => {
                    navigate(`/project`, {
                      state: { project }
                    });
                  }}
                  className="relative bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300 cursor-pointer"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{project.name}</h3>
                      {/* <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span> */}
                    </div>
                    
                    <div className="mt-2 flex-grow">
                      <div className="flex items-center text-sm text-gray-500">
                        <i className="ri-user-line mr-2"></i>
                        <span>{project.users.length} member{project.users.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <i className="ri-arrow-right-line text-gray-400"></i>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Create New Project</h3>
                  <button 
                    type="button" 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
              </div>
              <form onSubmit={createProject} className="px-6 py-5">
                <div className="mb-5">
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    onChange={(e) => setProjectName(e.target.value)}
                    value={projectName}
                    type="text"
                    placeholder="Enter project name"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;