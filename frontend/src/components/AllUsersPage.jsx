// frontend/src/components/AllUsersPage.jsx
import { useEffect, useState } from "react";
import api from "../api/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";  

export default function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/all")
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {users.length === 0 && (
            <p className="text-muted-foreground text-sm">No users found.</p>
          )}

          {users.map(u => (
            <Link
              key={u.user_id}
              to={`/users/${u.user_id}`}
              className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-600 text-white">
                  {u.first_name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-medium text-base">
                  {u.first_name} {u.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {u.email}
                </p>
              </div>

              <Badge variant="secondary" className="capitalize">
                {u.role}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
