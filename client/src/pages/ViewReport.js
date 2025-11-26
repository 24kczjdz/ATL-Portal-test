import React, { useEffect, useState } from 'react'
import sendnsee from "../handlers/ChatbotHandler.js";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Badge, PageTemplate, LoadingSpinner } from '../components/ui';
import { FiUser, FiBarChart, FiTrendingUp, FiBookOpen, FiMessageCircle, FiStar } from 'react-icons/fi';

function ViewReport() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    handleRead();
  }, [isAuthenticated, currentUser]);

  const defaultData = {
    profile: {
      image: "/asset/images/student.jpg",
      name: currentUser?.First_Name + " " + currentUser?.Last_Name || "User",
      age: "14",
      school: "HKUGA College",
      sex: currentUser?.Gender || "Not specified",
      curriculum: "HKDSE",
    },
    abilities: {
      NumericalReasoning: 2.0,
      LogicalReasoning: 2.0,
      GraphicalReasoning: 2.0,
      VerbalReasoning: 2.0,
      Memory: 2.0,
      Creativity: 2.0,
    },
    career: {
      explanation:
        "With your exceptional verbal reasoning skills and creativity, you would excel as a presenter. Your ability to communicate effectively and think on your feet makes you naturally suited for public speaking roles.",
      subjects: [
        {
          item: "中國語文",
          rate: "Compulsory",
          reqr: "中國語文教育學習領域配合整體的教育發展方向，為學生終身學習、生活和日後工作打好基礎。"
        }, 
        {
          item: "English Language",
          rate: "Compulsory",
          reqr: "The mastery of English is, therefore, vital to students in Hong Kong, as it opens up new possibilities for intellectual and social development, educational attainment, career advancement, personal fulfilment, and cultural understanding."
        },
        {
          item: "Mathematics (Compulsory Part)",
          rate: "Compulsory",
          reqr: "Mathematics provides a means to acquire, organise and apply information, and plays an important role in communicating ideas through pictorial, graphical, symbolic, descriptive and analytical representations.  "
        },
        {
          item: "Citizenship and Social Development",
          rate: "Compulsory",
          reqr: "The curriculum emphasises helping senior secondary students understand the situations of Hong Kong, the country and the contemporary  world, as well as their pluralistic and interdependent nature. "
        }
        //item: Subject name;
        //rate: Level of recommendation;
        //reqr: Required levels
      ],
    },
  };

  const [data, dataUpdate] = useState(defaultData);

  const readProfile = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch("api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ _id: currentUser.User_ID }),
      });

      if (response.ok) {
        const correspondent = await response.json();
        datacopy.profile.name = correspondent.alias;
        datacopy.profile.form = correspondent.form;
      } else {
        console.error("Profile error");
        alert("There was an error reading your profile. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error occurred. Please check your connection and try again.");
    }

    try {
      const response = await fetch("api/subject_rcmd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ _id: currentUser.User_ID }),
      });

      if (response.ok) {
        const correspondent = await response.json();
        console.log(correspondent.subjects);
      } else {
        console.error("Subjects error");
        alert("There was an error reading your abilities. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
    }

    return datacopy.profile;
  }

  const readAbilities = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch("api/ability_6d/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ _id: currentUser.User_ID }),
      });

      if (response.ok) {
        const correspondent = await response.json();
        datacopy.abilities.NumericalReasoning = correspondent.ability_6d[0];
        datacopy.abilities.LogicalReasoning = correspondent.ability_6d[1];
        datacopy.abilities.GraphicalReasoning = correspondent.ability_6d[2];
        datacopy.abilities.VerbalReasoning = correspondent.ability_6d[3];
        datacopy.abilities.Memory = correspondent.ability_6d[4];
        datacopy.abilities.Creativity = correspondent.ability_6d[5];
        return datacopy.abilities;
      } else {
        console.error("readAbilities(): Runtime error");
        alert("There was an error reading your abilities. Please try again.");
        return "Error";
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error occurred. Please check your connection and try again.");
      return error;
    }
  }

  const askATLabBody = async () => {
    var input = "Hi ATLab! I am " + datacopy.profile.name + " in " + datacopy.profile.school + ", form " + datacopy.profile.form + ". ";
    for (const [key, value] of Object.entries(datacopy.abilities)) {
      input += "My " + key.replace(/([A-Z])/g, " $1").trim() + " is " + value + " out of 5. ";
    }
    input += "What should I study for " + datacopy.profile.curriculum + "? Thanks!";

    return await sendnsee(input).then(val => {
      datacopy.career.explanation = val;
      return val;
    }).catch(err => {
      return err;
    }, 1000);
  }

  const askATLabHeader = async () => {
    //Header
    return await sendnsee("Please also give me just strictly one phrase -- within 5 words -- as a word of advise; no punctuations, and nothing more.").then(val => {
      return val;
    }).catch(err => {
      return err;
    }, 1000);
  }


  var datacopy = data;
  const handleRead = async () => {
    console.log("readProfile(): ", await readProfile());
    console.log("readAbilities(): ", await readAbilities());
    console.log("askATLabBody(): ", await askATLabBody());
    console.log("askATLabHeader(): ", await askATLabHeader());
    //Update
    console.log("dataUpdate: ", datacopy);
    dataUpdate(datacopy);
    setTimeout(() => {
      // simulate a delay
      setLoading(false); //set loading state
      console.log("handleRead(): Completed");
  }, 500)
    return data;
  };

  if (isLoading) {
    return (
      <PageTemplate
        title="Personal Report"
        description="Your comprehensive ability assessment and career guidance"
        loading={true}
      />
    );
  }

  return (
    <PageTemplate
      title="Personal Report"
      description="Your comprehensive ability assessment and career guidance"
      icon="📊"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card hover>
          <Card.Content className="p-6">
            <div className="flex flex-wrap items-center gap-8">
              <div className="relative">
                <img
                  src={data.profile.image}
                  alt="Student profile"
                  className="w-32 h-32 rounded-full object-cover shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</p>
                  <p className="font-serif font-semibold text-primary-900 dark:text-white" id="name">{data.profile.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Age</p>
                  <p className="font-elegant font-semibold text-primary-800 dark:text-gray-200" id="age">{data.profile.age}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">School</p>
                  <p className="font-elegant font-semibold text-primary-800 dark:text-gray-200" id="school">
                    {data.profile.school}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Gender</p>
                  <p className="font-elegant font-semibold text-primary-800 dark:text-gray-200" id="sex">{data.profile.sex}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1" id="curriculum">Curriculum</p>
                  <Badge variant="primary" size="lg">
                    {data.profile.curriculum}
                  </Badge>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ability Assessment */}
          <Card hover>
            <Card.Header>
              <Card.Title className="flex items-center font-serif">
                <FiBarChart className="mr-2" />
                Ability Assessment
              </Card.Title>
              <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                Your cognitive abilities across six key dimensions
              </p>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="relative w-full h-[300px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-[300px] aspect-square relative">
                    {Object.entries(data.abilities).map(([key, value], index) => {
                      const angle =
                        (index * Math.PI * 2) /
                        Object.keys(data.abilities).length;
                      const radius = 120;
                      const x = Math.cos(angle) * radius * (value / 5);
                      const y = Math.sin(angle) * radius * (value / 5);

                      return (
                        <div key={key}>
                          <div
                            className="absolute w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full shadow-sm"
                            style={{
                              left: "50%",
                              top: "50%",
                              transform: `translate(${x}px, ${y}px)`,
                            }}
                          />
                          <div
                            className="absolute h-[1px] bg-primary-200 dark:bg-primary-600"
                            style={{
                              left: "50%",
                              top: "50%",
                              width: `${radius}px`,
                              transform: `rotate(${(angle * 180) / Math.PI}deg)`,
                              transformOrigin: "0 0",
                            }}
                          />
                          <span
                            className="absolute text-sm font-elegant text-primary-600 dark:text-primary-300 whitespace-nowrap"
                            style={{
                              left: "50%",
                              top: "50%",
                              transform: `translate(${x * 1.2}px, ${y * 1.2}px)`,
                            }}
                          >
                            {value}/5
                          </span>
                          <span
                            className="absolute text-sm font-literary text-gray-700 dark:text-gray-300 whitespace-nowrap text-left"
                            style={{
                              left: "50%",
                              top: "50%",
                              transform: `translate(${Math.cos(angle) * radius * 1.5 - 40}px, ${Math.sin(angle) * radius * 1.4 - 10}px)`,
                            }}
                          >
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </div>
                      );
                    })}
                    <div className="absolute inset-0 border-2 border-primary-100 dark:border-primary-800 rounded-full" />
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Career Guidance */}
          <Card hover>
            <Card.Header>
              <Card.Title className="flex items-center font-serif">
                <FiTrendingUp className="mr-2" />
                Career Guidance
              </Card.Title>
              <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
                Personalized recommendations based on your abilities
              </p>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="mb-6">
                <p className="font-literary text-gray-700 dark:text-gray-300 leading-relaxed">{data.career.explanation}</p>
              </div>
              <div className="flex justify-end">
                <Link to="/ChatBot">
                  <Button variant="primary" className="flex items-center gap-2">
                    <FiMessageCircle className="w-4 h-4" />
                    Tell ATLab more...
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>
        </div>

        </div>

        {/* Recommended Subjects */}
        <Card hover>
          <Card.Header>
            <Card.Title className="flex items-center font-serif">
              <FiBookOpen className="mr-2" />
              Recommended {data.profile.curriculum} Electives
            </Card.Title>
            <p className="font-literary text-primary-600 dark:text-gray-300 mt-1">
              Subject recommendations tailored to your abilities
            </p>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.career.subjects.map((subject, index) => (
                <Card key={index} className="overflow-hidden">
                  <Card.Header className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-serif font-semibold text-primary-900 dark:text-white text-sm leading-tight">
                          {subject.item}
                        </h4>
                        <Badge 
                          variant={subject.rate === 'Compulsory' ? 'primary' : 'secondary'} 
                          size="sm" 
                          className="mt-2"
                        >
                          {subject.rate}
                        </Badge>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content className="pt-0">
                    <p className="font-literary text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{subject.reqr}</p>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>
    </PageTemplate>
  );
}

export default ViewReport
