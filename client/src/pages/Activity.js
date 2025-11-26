import React, { useEffect } from "react";
import ActivityForm from '../components/ActivityForm';
import DBTable from "../handlers/DatabaseHandler";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { PageTemplate } from '../components/ui';

function Activity() {
  const { Act_ID } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, currentUser]);

  const activitySchema = {
    Act_ID: "LOADER",
    Title: "ATL Activity",
    Pointer: 2,
    Ending: 2,
    Questions: [{
      Type: "Basic Info",
      Text: "Please enter Activity PIN:",
      Answers: ["Activity PIN", "Act_ID"]
    }, {
      Type: "Basic Info",
      Text: "Please enter your UID:",
      Answers: ["UID", "User_ID"]
    }, {
      Type: "Basic Info",
      Text: "Please enter your alias:",
      Answers: ["Alias", "Nickname"]
    }, 
    ]
  };

  const partiSchema = {
    Parti_ID: {
      User_ID: currentUser?.User_ID || "",
      Act_ID: Act_ID || ""
    },
    Nickname: currentUser?.Nickname || "",
    Answers: [],
    Scores: []
  };

  return (
    <PageTemplate
      title="Activity"
      description="Participate in lab activities"
      icon="🎯"
    >
      <div className="max-w-4xl mx-auto">
        <ActivityForm 
          className="w-full" 
          server={new DBTable("ACTIVITY", "Act_ID", activitySchema)} 
          table={new DBTable("PARTICIPANT", "Parti_ID", partiSchema)}
          Act_ID={Act_ID}
        />
      </div>
    </PageTemplate>
  );
}

export default Activity;