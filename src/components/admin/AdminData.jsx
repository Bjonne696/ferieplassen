import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import DiscountCodeManager from "./DiscountCodeManager";

export default function AdminData() {
  const [users, setUsers] = useState([]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, last_name, email, region");

    if (!error) {
      setUsers(data);
    } else {
      console.error("Feil ved henting av profiler:", error.message);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDelete = async (userId) => {
    const bekreft = window.confirm("Er du sikker på at du vil slette denne brukeren?");
    if (!bekreft) return;

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Feil ved sletting av profile:", profileError.message);
      return;
    }

    const { error: authError } = await supabase.rpc("delete_user_account", {
      uid: userId,
    });

    if (authError) {
      console.warn("Bruker slettet fra profiles, men ikke fra auth.users:", authError.message);
    }

    alert("Bruker slettet!");
    fetchProfiles();
  };

  return (
    <div className="admin-data">
      <DiscountCodeManager />

      <h2 className="admin-data__section-title admin-data__users-heading">Alle brukere</h2>
      <table className="admin-data__table admin-data__users-table">
        <thead>
          <tr>
            <th className="admin-data__table-heading admin-data__column-heading">Navn</th>
            <th className="admin-data__table-heading admin-data__column-heading">Område</th>
            <th className="admin-data__table-heading admin-data__column-heading">E-post</th>
            <th className="admin-data__table-heading admin-data__column-heading">Handling</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
              <tr className="admin-data__user-row" key={user.id}>
                <td className="admin-data__table-cell admin-data__user-name" data-label="Navn">{`${user.name} ${user.last_name}`}</td>
                <td className="admin-data__table-cell admin-data__user-region" data-label="Område">{user.region || "-"}</td>
                <td className="admin-data__table-cell admin-data__user-email" data-label="E-post">{user.email}</td>
                <td className="admin-data__table-cell admin-data__user-actions" data-label="Handling">
                  <button className="admin-data__delete-button" type="button" onClick={() => handleDelete(user.id)}>Slett</button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
