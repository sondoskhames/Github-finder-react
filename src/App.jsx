import { useState, useEffect } from "react";

const TRY = ["Sondos", "Engy", "Mayada"];

const RULES = [
  [/[\u0600-\u06FF]/, "مفيش أكونت اسمه بحروف عربي، الاسم لازم يكون إنجليزي."],
  [/^\d+$/, "مفيش اسم بالشكل ده، الاسم مينفعش يكون أرقام بس."],
  [/[^a-zA-Z0-9-]/, "الاسم يتكوّن من حروف إنجليزية وأرقام وشرطة (-) فقط."],
  [/^-|-$/, "الاسم لا يمكن أن يبدأ أو ينتهي بشرطة (-)."],
  [/--/, "لا يمكن وضع شرطتين متتاليتين (--) في الاسم."],
  [/.{40}/, "الاسم لا يزيد عن 39 حرفًا."],
];

const LIMIT_MSG = "وصلت للحد الأقصى من الطلبات، جرّبي بعد شوية.";
const get = (url, signal) => fetch(url, { signal }).then((r) => r.json());

export default function App() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState(null); // object جديد في كل بحث
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState("");
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // أول 20 أكونت بنفس الاسم
  useEffect(() => {
    if (!query) return;
    const c = new AbortController();
    setSearching(true);
    get(`https://api.github.com/search/users?q=${query.text}+in:login&per_page=20`, c.signal)
      .then((d) => {
        if (d.message) return setError(LIMIT_MSG);
        setUsers(d.items || []);
      })
      .catch((e) => e.name !== "AbortError" && setError("حصل خطأ في الاتصال، حاولي تاني."))
      .finally(() => !c.signal.aborted && setSearching(false));
    return () => c.abort();
  }, [query]);

  // بروفايل الأكونت اللي اتدوس عليه
  useEffect(() => {
    if (!selected) return;
    const c = new AbortController();
    setProfile(null);
    setLoadingProfile(true);
    Promise.all([
      get(`https://api.github.com/users/${selected}`, c.signal),
      get(`https://api.github.com/users/${selected}/repos?sort=updated&per_page=5`, c.signal),
    ])
      .then(([u, r]) => {
        if (u.message) return setError(LIMIT_MSG);
        setError("");
        setProfile(u);
        setRepos(Array.isArray(r) ? r : []);
      })
      .catch((e) => e.name !== "AbortError" && setError("حصل خطأ في الاتصال، حاولي تاني."))
      .finally(() => !c.signal.aborted && setLoadingProfile(false));
    return () => c.abort();
  }, [selected]);

  function search(value) {
    const v = value.trim();
    if (!v) return;
    const broken = RULES.find(([re]) => re.test(v));
    setUsers([]);
    setSelected("");
    setProfile(null);
    setError(broken ? broken[1] : "");
    setQuery(broken ? null : { text: v });
  }

  function openProfile(login) {
    setSelected(login);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0d1520] px-4 py-6 text-white sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
        <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">GitHub Profile Finder</h1>
        <p className="mt-1 text-sm text-slate-400">
          Search any GitHub user to see their profile and latest repositories.
        </p>

        {/* الفورم: عمودي على الموبايل، أفقي من التابلت */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(input);
          }}
          className="mt-5 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a GitHub username..."
            className="min-w-0 flex-1 rounded-xl border-2 border-yellow-400 bg-[#16212e] px-4 py-3 outline-none"
          />
          <button className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300">
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-blue-300">
          <span>Try:</span>
          {TRY.map((n) => (
            <button
              key={n}
              onClick={() => {
                setInput(n);
                search(n);
              }}
              className="rounded-full border border-slate-700 bg-[#16212e] px-3 py-1 hover:border-yellow-400"
            >
              {n}
            </button>
          ))}
        </div>

        {error && (
          <p dir="rtl" className="mt-5 text-red-400">
            {error}
          </p>
        )}

        {/* كارت البروفايل (فوق القايمة) */}
        {loadingProfile && <p className="mt-6 text-slate-400">Loading profile...</p>}
        {profile && (
          <div className="mt-6 rounded-2xl border border-slate-700 bg-[#16212e] p-4 sm:p-5">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <img
                src={profile.avatar_url}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full border-2 border-yellow-400 sm:h-24 sm:w-24"
              />
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold sm:text-2xl">
                  {profile.name || profile.login}
                </h2>
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-300 hover:underline"
                >
                  @{profile.login}
                </a>
                {profile.bio && (
                  <p className="mt-1 break-words text-sm text-slate-300">{profile.bio}</p>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  {profile.public_repos} repos · {profile.followers} followers ·{" "}
                  {profile.following} following
                </p>
              </div>
            </div>

            <h3 className="mt-5 mb-2 font-semibold">Latest Repositories</h3>
            {repos.length === 0 ? (
              <p className="text-sm text-slate-500">No public repositories.</p>
            ) : (
              <ul className="grid gap-2 lg:grid-cols-2">
                {repos.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#0d1520] p-3"
                  >
                    <a
                      href={r.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 truncate font-semibold text-blue-300 hover:underline"
                    >
                      {r.name}
                    </a>
                    <span className="shrink-0 text-xs text-slate-500">⭐ {r.stargazers_count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ليست الـ 20 أكونت: 1 عمود موبايل، 2 تابلت، 3 لاب */}
        {searching && <p className="mt-6 text-slate-400">Searching...</p>}
        {!searching && query && !error && users.length === 0 && (
          <p dir="rtl" className="mt-6 text-slate-400">
            مفيش نتايج للاسم ده.
          </p>
        )}
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => openProfile(u.login)}
                className={`flex w-full items-center gap-3 rounded-xl border bg-[#16212e] p-2 text-left hover:border-yellow-400 ${
                  selected === u.login ? "border-yellow-400" : "border-slate-700"
                }`}
              >
                <img src={u.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full" />
                <span className="min-w-0 truncate text-blue-300">{u.login}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}