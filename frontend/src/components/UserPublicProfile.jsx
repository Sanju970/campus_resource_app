import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { useParams } from "react-router-dom";

export default function UserPublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/user/${userId}`)
      .then(res => setProfile(res.data))
      .catch(() => {});
  }, [userId]);

  if (!profile) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">
            {profile.first_name} {profile.last_name}
          </h1>

          <p className="text-gray-700"><strong>Email:</strong> {profile.email}</p>

          <p className="text-gray-700">
            <strong>Bio:</strong> {profile.bio || "No bio provided"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
