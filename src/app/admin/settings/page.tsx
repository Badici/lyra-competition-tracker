export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Variabile de mediu (server)
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Aplicația folosește un proxy Next.js către Django. Configurează URL-ul și
        numele resurselor pentru a se potrivi cu router-ul DRF.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-800 dark:text-zinc-200">
        <li>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            DJANGO_API_BASE
          </code>{" "}
          — originea API (ex. https://fishtopia.cuibusoru.ro)
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            DJANGO_API_URL_PREFIX
          </code>{" "}
          — segment după host (implicit: api)
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            DJANGO_TOKEN_PATHS
          </code>{" "}
          — liste separate prin virgulă, încercate la login (implicit: token,
          auth/token, v1/token, auth/login)
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            DJANGO_ME_PATH
          </code>{" "}
          — colecția utilizatori (implicit: users); poate fi și users/me dacă API-ul
          expune profilul acolo
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            DJANGO_ME_ALTERNATE_PATHS
          </code>{" "}
          — căi suplimentare separate prin virgulă, încercate pentru is_staff
          (implicit: users/me,auth/user,auth/me)
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            LYRA_STAFF_USERNAMES
          </code>{" "}
          — listă de utilizatori tratați ca staff în UI dacă serializer-ul Django nu
          trimite is_staff / is_superuser (ex.: badici,raresb)
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            DJANGO_RESOURCE_*
          </code>{" "}
          — competitions, teams, sectors, weigh_ins, prizes
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            NEXT_PUBLIC_WS_URL
          </code>{" "}
          — opțional, pentru invalidare cache la mesaje WebSocket
        </li>
      </ul>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Django „Staff” / „Superuser” din admin nu apar automat în JSON dacă
        UserSerializer-ul nu include{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          is_staff
        </code>{" "}
        /{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          is_superuser
        </code>
        . Soluții: extinde serializer-ul pentru utilizatorul curent, pune aceste
        câmpuri în JWT la login, sau setează{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          LYRA_STAFF_USERNAMES
        </code>{" "}
        în <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code>.
      </p>
    </div>
  );
}
