import {
  Bell,
  BriefcaseBusiness,
  HeartHandshake,
  Home,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
  UsersRound,
  Wifi
} from "lucide-react";

function Dashboard({ currentUser, dashboard, message, onMarkSafe, onSafetyPin }) {
  const womenNearby = dashboard.womenNearby || [];
  const workersNearby = dashboard.workersNearby || [];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xl font-extrabold">EmpowHer</p>
              <p className="text-sm text-slate-500">Community Safety</p>
            </div>
          </div>

          <nav className="grid gap-2">
            <button className="side-link-active"><Home size={19} />Dashboard</button>
            <button className="side-link"><UsersRound size={19} />Connections</button>
            <button className="side-link"><BriefcaseBusiness size={19} />Jobs</button>
            <button className="side-link"><HeartHandshake size={19} />Help</button>
            <button onClick={onSafetyPin} className="side-link"><Wifi size={19} />Safety Pin</button>
          </nav>
        </aside>

        <section className="p-5 md:p-8">
          <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-indigo-600">Welcome, {currentUser.name}</p>
              <h1 className="mt-2 text-4xl font-extrabold">Dashboard</h1>
              <p className="mt-2 flex items-center gap-2 text-slate-600">
                <MapPin size={18} /> {currentUser.locality}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <UserRound size={22} />
              <div>
                <p className="font-bold capitalize">{currentUser.role}</p>
                <p className="text-sm text-slate-500">{currentUser.phone}</p>
              </div>
            </div>
          </header>

          {message && <p className="mb-5 rounded-lg bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">{message}</p>}

          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <button className="action-card"><UsersRound className="text-emerald-500" />Connect</button>
            <button className="action-card"><HeartHandshake className="text-orange-500" />Help</button>
            <button className="action-card"><BriefcaseBusiness className="text-indigo-500" />Open Job</button>
            <button onClick={onSafetyPin} className="action-card"><Bell className="text-sky-500" />Safety Pin</button>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="panel">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-extrabold">Women Nearby</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{womenNearby.length}</span>
              </div>

              <div className="grid gap-3">
                {womenNearby.length === 0 && <p className="empty-text">No women found in your locality yet.</p>}
                {womenNearby.map((woman) => (
                  <article key={woman._id} className="list-card">
                    <div>
                      <h3 className="font-bold">{woman.name}</h3>
                      <p className="text-sm text-slate-500">{woman.locality}</p>
                    </div>
                    <button className="small-button">Connect</button>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-extrabold">Workers Nearby</h2>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">{workersNearby.length}</span>
              </div>

              <div className="grid gap-3">
                {workersNearby.length === 0 && <p className="empty-text">No workers found in your locality yet.</p>}
                {workersNearby.map((worker) => (
                  <article key={worker._id} className="list-card">
                    <div>
                      <h3 className="font-bold">{worker.name}</h3>
                      <p className="text-sm text-slate-500">{worker.workType || "Worker"} in {worker.locality}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-bold text-amber-600">
                        <Star size={16} fill="currentColor" />
                        {worker.safetyRating || 0} rating from {worker.ratingCount || 0} marks
                      </p>
                    </div>
                    {currentUser.role === "woman" && (
                      <button onClick={() => onMarkSafe(worker._id)} className="small-button">Mark Safe</button>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
