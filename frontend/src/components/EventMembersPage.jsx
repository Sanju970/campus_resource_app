import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import api from "../api/api";

export default function EventMembersPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventInfo, setEventInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await api.get(`/events/${eventId}`);
        setEventInfo(eventRes.data);

        const membersRes = await api.get(`/events/${eventId}/registrations`);
        setMembers(membersRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load event members");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Event Members</h1>
        <Button variant="outline" onClick={() => navigate("/events")}>
          Back to Events
        </Button>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">
            Registered Members {members.length ? `(${members.length})` : ""}
          </CardTitle>
          {eventInfo && (
            <p className="text-sm text-muted-foreground mt-1">
              {eventInfo.title}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground">
              No members have registered yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full border-collapse text-sm">

                {/* TOP GREY LINE */}
                <thead>
                  <tr className="border-b border-gray-300">
                    <th colSpan="4" className="py-1"></th>
                  </tr>

                  {/* HEADER ROW */}
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold">
                      User UID
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold">
                      Role
                    </th>
                  </tr>

                  {/* GREY LINE BELOW HEADER */}
                  <tr className="border-b border-gray-300">
                    <th colSpan="4" className="py-1"></th>
                  </tr>
                </thead>

                {/* DATA ROWS */}
                <tbody className="divide-y divide-gray-300">
                  {members.map((m, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-3 text-left">{m.user_uid}</td>
                      <td className="px-6 py-3 text-left">
                        {m.first_name} {m.last_name}
                      </td>
                      <td className="px-6 py-3 text-left">{m.email}</td>
                      <td className="px-6 py-3 text-left capitalize">
                        {m.role_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
