import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  OrinClient,
  type Actor,
  type CampusEvent,
  type Registration,
  type Certificate,
  type Notice,
  type Review,
} from "../../packages/contracts/src/index";
// Native UI only: no WebView, Capacitor, hosted web page, or web bundle.
const api = new OrinClient(
  process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === "android"
      ? "http://10.0.2.2:4100"
      : "http://127.0.0.1:4100"),
);
type College = { id: string; name: string; city: string };
function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[s.button, disabled && { opacity: 0.4 }]}
    >
      <Text style={s.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}
function Field({
  label,
  value,
  onChange,
  secure = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        multiline={multiline}
        autoCapitalize="none"
        style={[s.input, multiline && { minHeight: 90 }]}
      />
    </View>
  );
}
function Screen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const { width } = useWindowDimensions();
  const [actor, setActor] = useState<Actor | null>(null),
    [page, setPage] = useState("Discover"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [events, setEvents] = useState<CampusEvent[]>([]),
    [regs, setRegs] = useState<Registration[]>([]),
    [certs, setCerts] = useState<Certificate[]>([]),
    [notes, setNotes] = useState<Notice[]>([]),
    [reviews, setReviews] = useState<Review[]>([]),
    [colleges, setColleges] = useState<College[]>([]),
    [selected, setSelected] = useState<CampusEvent | null>(null),
    [participants, setParticipants] = useState<any[]>([]),
    [updates, setUpdates] = useState<any[]>([]),
    [search, setSearch] = useState(""),
    [scope, setScope] = useState("all");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [signup, setSignup] = useState(false),
    [verifyToken, setVerifyToken] = useState(""),
    [resetToken, setResetToken] = useState(""),
    [college, setCollege] = useState(""),
    [evidence, setEvidence] = useState(""),
    [requestKind, setRequestKind] = useState("college"),
    [announcement, setAnnouncement] = useState(""),
    [pass, setPass] = useState(""),
    [awards, setAwards] = useState("[]"),
    [certCode, setCertCode] = useState("");
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    genre: "",
    venue: "",
    capacity: "100",
    visibility: "college_only",
    registration_deadline: "",
    starts_at: "",
    ends_at: "",
    allowed_colleges: "",
  });
  const host = !!actor?.roles.length;
  const admin = actor?.roles.some((r) => r.role !== "organizer");
  async function refresh() {
    const data = await api.request<{ items: CampusEvent[] }>(
      `/v1/events?search=${encodeURIComponent(search)}&scope=${scope}`,
    );
    setEvents(data.items);
    setColleges(await api.request<College[]>("/v1/colleges"));
    if (api.token) {
      const a = await api.request<Actor>("/v1/me");
      setActor(a);
      setRegs(await api.request<Registration[]>("/v1/registrations"));
      setCerts(await api.request<Certificate[]>("/v1/certificates"));
      setNotes(await api.request<Notice[]>("/v1/notifications"));
      if (a.roles.some((r) => r.role !== "organizer"))
        setReviews(await api.request<Review[]>("/v1/reviews"));
    }
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void run(async () => {
      api.token = await SecureStore.getItemAsync("orin.session");
      try {
        await refresh();
      } catch (e) {
        if ((e as any).status === 401) {
          api.token = null;
          await SecureStore.deleteItemAsync("orin.session");
          setActor(null);
          await refresh();
        } else throw e;
      }
    });
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void run(refresh);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    void run(refresh);
  }, [scope]);
  async function open(e: CampusEvent) {
    setSelected(await api.request<CampusEvent>(`/v1/events/${e.id}`));
    setUpdates(await api.request<any[]>(`/v1/events/${e.id}/updates`));
    if (
      actor &&
      (e.organizer_id === actor.id ||
        actor.roles.some(
          (r) =>
            r.role === "platform_admin" ||
            (r.role === "college_admin" && r.college_id === e.college_id),
        ))
    )
      setParticipants(
        await api.request<any[]>(`/v1/events/${e.id}/participants`),
      );
    else setParticipants([]);
  }
  async function login() {
    if (signup) {
      await api.request("/v1/auth/signup", "POST", {
        full_name: name,
        email,
        password,
      });
      setSignup(false);
      setMessage("Check your email for verification, then sign in.");
      return;
    }
    const data = await api.request<{ token: string; actor: Actor }>(
      "/v1/auth/login",
      "POST",
      { email, password },
    );
    api.token = data.token;
    await SecureStore.setItemAsync("orin.session", data.token);
    setActor(data.actor);
    setPassword("");
    await refresh();
    setPage("Discover");
  }
  const mayManage =
    selected &&
    actor &&
    (selected.organizer_id === actor.id ||
      actor.roles.some(
        (r) =>
          r.role === "platform_admin" ||
          (r.role === "college_admin" && r.college_id === selected.college_id),
      ));
  return (
    <SafeAreaView style={s.safe}>
      <Modal visible={scanning} onRequestClose={() => setScanning(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <Button title="Close scanner" onPress={() => setScanning(false)} />
          {cameraPermission?.granted && (
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={(result) => {
                setScanning(false);
                setPass(result.data);
                setMessage("Pass scanned. Confirm check-in below.");
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
      <View style={s.header}>
        <View>
          <Text style={s.brand}>orin</Text>
          <Text style={s.sub}>Your campus. Your next opportunity.</Text>
        </View>
        <Button
          title="Refresh"
          disabled={busy}
          onPress={() => void run(refresh)}
        />
      </View>
      <ScrollView horizontal style={s.tabs} contentContainerStyle={{ gap: 8 }}>
        {[
          "Discover",
          "My events",
          "Recognition",
          "Updates",
          ...(host ? ["Host"] : []),
          ...(admin ? ["Approvals"] : []),
          "Account",
        ].map((p) => (
          <Button
            key={p}
            title={p === page ? "• " + p : p}
            onPress={() => {
              setPage(p);
              setSelected(null);
            }}
          />
        ))}
      </ScrollView>
      <ScrollView
        contentContainerStyle={[
          s.body,
          {
            maxWidth: width > 800 ? 1000 : undefined,
            alignSelf: width > 800 ? "center" : undefined,
            width: "100%",
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {busy && (
          <ActivityIndicator accessibilityLabel="Loading" color="#16543c" />
        )}
        {!!message && (
          <Text accessibilityRole="alert" style={s.notice}>
            {message}
          </Text>
        )}
        {selected ? (
          <>
            <Button title="Back" onPress={() => setSelected(null)} />
            <View style={s.card}>
              <Text style={s.tag}>
                {selected.genre} · {selected.status}
              </Text>
              <Text style={s.h1}>{selected.title}</Text>
              <Text style={s.bodyText}>{selected.description}</Text>
              <Text>{selected.venue}</Text>
              <Text>{new Date(selected.starts_at).toLocaleString()}</Text>
              <Text>
                Registration closes{" "}
                {new Date(selected.registration_deadline).toLocaleString()}
              </Text>
              <Button
                title={actor ? "Register" : "Sign in to register"}
                disabled={busy || !actor || selected.status !== "published"}
                onPress={() =>
                  void run(async () => {
                    const r = await api.request<Registration>(
                      `/v1/events/${selected.id}/register`,
                      "POST",
                    );
                    await refresh();
                    setMessage(`Registration ${r.status}`);
                  })
                }
              />
            </View>
            <Text style={s.h2}>Event updates</Text>
            {updates.map((u) => (
              <Text style={s.card} key={u.id}>
                {u.body}
              </Text>
            ))}
            {mayManage && (
              <View style={s.card}>
                <Text style={s.h2}>Host controls</Text>
                {(
                  {
                    draft: ["published", "cancelled"],
                    published: ["ongoing", "cancelled"],
                    ongoing: ["completed", "cancelled"],
                    completed: [],
                    cancelled: [],
                  } as Record<string, string[]>
                )[selected.status].map((status) => (
                  <Button
                    key={status}
                    disabled={busy}
                    title={"Set " + status}
                    onPress={() =>
                      void run(async () => {
                        await api.request(
                          `/v1/events/${selected.id}/status`,
                          "POST",
                          { status, version: selected.version },
                        );
                        await refresh();
                        await open(selected);
                      })
                    }
                  />
                ))}
                <Field
                  label="Announcement"
                  value={announcement}
                  onChange={setAnnouncement}
                  multiline
                />
                <Button
                  title="Post update"
                  onPress={() =>
                    void run(async () => {
                      await api.request(
                        `/v1/events/${selected.id}/updates`,
                        "POST",
                        { body: announcement },
                      );
                      setAnnouncement("");
                      await open(selected);
                    })
                  }
                />
                <Button
                  title="Scan attendance QR"
                  onPress={() =>
                    void run(async () => {
                      const permission = cameraPermission?.granted
                        ? cameraPermission
                        : await requestCameraPermission();
                      if (permission.granted) setScanning(true);
                      else
                        setMessage(
                          "Camera permission is required to scan; you can enter the pass manually.",
                        );
                    })
                  }
                />
                <Field
                  label="Attendance pass token"
                  value={pass}
                  onChange={setPass}
                />
                <Button
                  title="Check in participant"
                  onPress={() =>
                    void run(async () => {
                      await api.request(
                        `/v1/events/${selected.id}/check-in`,
                        "POST",
                        { qr_token: pass },
                      );
                      setPass("");
                      await open(selected);
                    })
                  }
                />
                <Text style={s.h2}>Participants</Text>
                {participants.map((r) => (
                  <Text key={r.id}>
                    {r.full_name} · {r.status}
                  </Text>
                ))}
                {selected.status === "completed" && (
                  <>
                    <Field
                      label="Awards JSON (or [] for participation)"
                      value={awards}
                      onChange={setAwards}
                      multiline
                    />
                    <Button
                      title="Publish recognition"
                      onPress={() =>
                        void run(async () => {
                          await api.request(
                            `/v1/events/${selected.id}/results`,
                            "POST",
                            { awards: JSON.parse(awards) },
                          );
                          setMessage("Recognition published");
                        })
                      }
                    />
                  </>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            {page === "Discover" && (
              <>
                <View style={s.hero}>
                  <Text style={s.heroText}>Find your people.</Text>
                  <Text style={s.heroText}>Make your next move.</Text>
                  <Text style={{ color: "#c4decf", marginTop: 16 }}>
                    Explore what is happening around your campus.
                  </Text>
                </View>
                <Field
                  label="Search interests and events"
                  value={search}
                  onChange={setSearch}
                />
                <Button title="Search" onPress={() => void run(refresh)} />
                <View style={s.row}>
                  {[
                    ["all", "All"],
                    ["college", "My college"],
                    ["partner", "Partners"],
                  ].map(([value, label]) => (
                    <Button
                      key={value}
                      title={label}
                      onPress={() => setScope(value)}
                    />
                  ))}
                </View>
                {events.map((e) => (
                  <View key={e.id} style={s.card}>
                    <Text style={s.tag}>
                      {e.genre} · {e.visibility.replace("_", " ")}
                    </Text>
                    <Text style={s.h2}>{e.title}</Text>
                    <Text style={s.bodyText}>
                      {e.description.slice(0, 150)}
                    </Text>
                    <Text>
                      {e.venue} · {new Date(e.starts_at).toLocaleDateString()}
                    </Text>
                    <Button
                      title="View event"
                      onPress={() => void run(() => open(e))}
                    />
                  </View>
                ))}
                {!events.length && <Text>No matching events yet.</Text>}
              </>
            )}
            {page === "My events" && (
              <>
                <Text style={s.h1}>Your registrations</Text>
                {regs.map((r) => (
                  <View key={r.id} style={s.card}>
                    <Text style={s.h2}>{r.title}</Text>
                    <Text>{r.status}</Text>
                    {r.status === "registered" && (
                      <>
                        <View
                          style={{
                            padding: 16,
                            backgroundColor: "white",
                            alignSelf: "center",
                          }}
                        >
                          <QRCode value={r.qr_token!} size={200} />
                        </View>
                        <Text selectable style={s.pass}>
                          {r.qr_token}
                        </Text>
                        <Text>
                          Show this pass at the event entrance. Keep it private.
                        </Text>
                      </>
                    )}
                    <Button
                      title="Cancel registration"
                      disabled={
                        busy || ["checked_in", "cancelled"].includes(r.status)
                      }
                      onPress={() =>
                        Alert.alert(
                          "Cancel registration?",
                          "Your seat may be offered to the waitlist.",
                          [
                            { text: "Keep seat", style: "cancel" },
                            {
                              text: "Cancel registration",
                              onPress: () =>
                                void run(async () => {
                                  await api.request(
                                    `/v1/events/${r.event_id}/cancel-registration`,
                                    "POST",
                                  );
                                  await refresh();
                                }),
                            },
                          ],
                        )
                      }
                    />
                  </View>
                ))}
              </>
            )}
            {page === "Recognition" && (
              <>
                <Text style={s.h1}>Your recognition</Text>
                {certs.map((c) => (
                  <View style={s.card} key={c.code}>
                    <Text style={s.h2}>{c.title}</Text>
                    <Text>
                      {c.full_name} · {c.award}
                    </Text>
                    <Text>
                      {c.revoked_at
                        ? "Revoked"
                        : "Issued " +
                          new Date(c.issued_at).toLocaleDateString()}
                    </Text>
                    <Text selectable>{c.code}</Text>
                  </View>
                ))}
                <Field
                  label="Certificate verification code"
                  value={certCode}
                  onChange={setCertCode}
                />
                <Button
                  title="Verify"
                  onPress={() =>
                    void run(async () => {
                      const c = await api.request<Certificate>(
                        "/v1/certificates/" + certCode,
                      );
                      setMessage(
                        `${c.full_name} — ${c.title} — ${c.award}${c.revoked_at ? " (REVOKED)" : ""}`,
                      );
                    })
                  }
                />
              </>
            )}
            {page === "Updates" && (
              <>
                <Text style={s.h1}>Updates</Text>
                {notes.map((n) => (
                  <View key={n.id} style={s.card}>
                    <Text style={s.h2}>{n.kind.replaceAll(".", " ")}</Text>
                    <Text>
                      {Object.entries(n.payload)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join("\n")}
                    </Text>
                    <Button
                      title={n.read_at ? "Read" : "Mark read"}
                      disabled={!!n.read_at}
                      onPress={() =>
                        void run(async () => {
                          await api.request(
                            `/v1/notifications/${n.id}/read`,
                            "POST",
                          );
                          await refresh();
                        })
                      }
                    />
                  </View>
                ))}
              </>
            )}
            {page === "Account" && (
              <>
                <Text style={s.h1}>
                  {actor ? "Your account" : "Join your campus"}
                </Text>
                {!actor ? (
                  <View style={s.card}>
                    {signup && (
                      <Field
                        label="Full name"
                        value={name}
                        onChange={setName}
                      />
                    )}
                    <Field label="Email" value={email} onChange={setEmail} />
                    <Field
                      label="Password (12+ characters)"
                      value={password}
                      onChange={setPassword}
                      secure
                    />
                    <Button
                      title={signup ? "Create account" : "Sign in"}
                      disabled={busy}
                      onPress={() => void run(login)}
                    />
                    <Button
                      title={
                        signup
                          ? "Already registered? Sign in"
                          : "Create an account"
                      }
                      onPress={() => setSignup(!signup)}
                    />
                    <Button
                      title="Send password reset email"
                      onPress={() =>
                        void run(async () => {
                          await api.request("/v1/auth/request-reset", "POST", {
                            email,
                          });
                          setMessage(
                            "If the account exists, instructions will arrive.",
                          );
                        })
                      }
                    />
                  </View>
                ) : (
                  <>
                    <View style={s.card}>
                      <Text style={s.h2}>{actor.full_name}</Text>
                      <Text>{actor.email}</Text>
                      <Text>
                        {actor.email_verified
                          ? "Email verified"
                          : "Email pending"}{" "}
                        · College: {actor.verification_status}
                      </Text>
                      <Button
                        title="Resend verification email"
                        onPress={() =>
                          void run(async () => {
                            await api.request(
                              "/v1/auth/resend-verification",
                              "POST",
                            );
                            setMessage("Verification requested");
                          })
                        }
                      />
                      <Button
                        title="Sign out"
                        onPress={() =>
                          void run(async () => {
                            try {
                              await api.request("/v1/auth/logout", "POST");
                            } finally {
                              await SecureStore.deleteItemAsync("orin.session");
                              api.token = null;
                              setActor(null);
                              setRegs([]);
                              setCerts([]);
                              setNotes([]);
                              setReviews([]);
                            }
                            await refresh();
                          })
                        }
                      />
                    </View>
                    <View style={s.card}>
                      <Text style={s.h2}>College / organizer access</Text>
                      <View style={s.row}>
                        <Button
                          title="College verification"
                          onPress={() => setRequestKind("college")}
                        />
                        <Button
                          title="Organizer request"
                          onPress={() => setRequestKind("organizer")}
                        />
                      </View>
                      <Text>Selected request: {requestKind}</Text>
                      {colleges.map((c) => (
                        <Button
                          key={c.id}
                          title={(college === c.id ? "✓ " : "") + c.name}
                          onPress={() => setCollege(c.id)}
                        />
                      ))}
                      <Field
                        label="Details for independent college review (no passwords or sensitive ID numbers)"
                        value={evidence}
                        onChange={setEvidence}
                        multiline
                      />
                      <Button
                        title="Submit review request"
                        onPress={() =>
                          void run(async () => {
                            await api.request("/v1/reviews", "POST", {
                              kind: requestKind,
                              college_id: college,
                              evidence,
                            });
                            setMessage("Request submitted");
                          })
                        }
                      />
                    </View>
                  </>
                )}
                <View style={s.card}>
                  <Field
                    label="Verification token from email"
                    value={verifyToken}
                    onChange={setVerifyToken}
                  />
                  <Button
                    title="Verify email"
                    onPress={() =>
                      void run(async () => {
                        await api.request("/v1/auth/verify-email", "POST", {
                          token: verifyToken,
                        });
                        await refresh();
                        setMessage("Email verified");
                      })
                    }
                  />
                  <Field
                    label="Reset token from email"
                    value={resetToken}
                    onChange={setResetToken}
                  />
                  <Field
                    label="New password"
                    value={password}
                    onChange={setPassword}
                    secure
                  />
                  <Button
                    title="Reset password"
                    onPress={() =>
                      void run(async () => {
                        await api.request("/v1/auth/reset-password", "POST", {
                          token: resetToken,
                          password,
                        });
                        await SecureStore.deleteItemAsync("orin.session");
                        api.token = null;
                        setActor(null);
                        setPassword("");
                        setMessage("Sign in with your new password");
                      })
                    }
                  />
                </View>
              </>
            )}
            {page === "Approvals" && (
              <>
                <Text style={s.h1}>College review queue</Text>
                {reviews.map((r) => (
                  <View key={r.id} style={s.card}>
                    <Text style={s.h2}>
                      {r.full_name} · {r.kind}
                    </Text>
                    <Text>{r.email}</Text>
                    <Text>{r.evidence}</Text>
                    {[true, false].map((approve) => (
                      <Button
                        key={String(approve)}
                        title={approve ? "Approve" : "Reject"}
                        onPress={() =>
                          void run(async () => {
                            await api.request(
                              `/v1/reviews/${r.id}/decision`,
                              "POST",
                              {
                                approve,
                                reason: approve
                                  ? "College reviewed"
                                  : "Contact college administrator",
                              },
                            );
                            await refresh();
                          })
                        }
                      />
                    ))}
                  </View>
                ))}
              </>
            )}
            {page === "Host" && (
              <>
                <Text style={s.h1}>Organizer workspace</Text>
                <View style={s.card}>
                  <Text style={s.h2}>Create an event draft</Text>
                  {(
                    [
                      "title",
                      "description",
                      "genre",
                      "venue",
                      "capacity",
                      "registration_deadline",
                      "starts_at",
                      "ends_at",
                      "allowed_colleges",
                    ] as const
                  ).map((k) => (
                    <Field
                      key={k}
                      label={
                        k.endsWith("_at") || k === "registration_deadline"
                          ? k + " (ISO date, e.g. 2027-02-01T09:00:00Z)"
                          : k === "allowed_colleges"
                            ? "Invited college IDs, comma-separated"
                            : k
                      }
                      value={draft[k]}
                      onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))}
                      multiline={k === "description"}
                    />
                  ))}
                  <Text>Audience: {draft.visibility}</Text>
                  <View style={s.row}>
                    {["college_only", "partner", "public"].map((v) => (
                      <Button
                        key={v}
                        title={v}
                        onPress={() =>
                          setDraft((d) => ({ ...d, visibility: v }))
                        }
                      />
                    ))}
                  </View>
                  <Button
                    title="Save draft"
                    onPress={() =>
                      void run(async () => {
                        await api.request("/v1/events", "POST", {
                          ...draft,
                          capacity: Number(draft.capacity),
                          allowed_colleges: draft.allowed_colleges
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        });
                        await refresh();
                        setMessage("Draft created");
                      })
                    }
                  />
                </View>
                {events
                  .filter(
                    (e) =>
                      actor &&
                      (e.organizer_id === actor.id ||
                        actor.roles.some(
                          (r) =>
                            r.role === "platform_admin" ||
                            (r.role === "college_admin" &&
                              r.college_id === e.college_id),
                        )),
                  )
                  .map((e) => (
                    <View key={e.id} style={s.card}>
                      <Text style={s.h2}>{e.title}</Text>
                      <Text>{e.status}</Text>
                      <Button
                        title="Manage"
                        onPress={() => void run(() => open(e))}
                      />
                    </View>
                  ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Screen />
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f7f5" },
  header: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  brand: { fontSize: 34, fontWeight: "800", color: "#174b37" },
  sub: { fontSize: 11, color: "#657a6c" },
  tabs: { flexGrow: 0, maxHeight: 70, padding: 12, backgroundColor: "#fff" },
  body: { padding: 20, paddingBottom: 60, gap: 12 },
  h1: { fontSize: 28, fontWeight: "700", color: "#183b2b", marginVertical: 12 },
  h2: { fontSize: 20, fontWeight: "600", color: "#183b2b", marginVertical: 8 },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#dce7df",
    backgroundColor: "#fff",
    borderRadius: 15,
    gap: 12,
    marginVertical: 5,
  },
  bodyText: { fontSize: 15, color: "#596e60", lineHeight: 24 },
  tag: { fontSize: 11, color: "#287046", textTransform: "uppercase" },
  button: {
    borderRadius: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: "#b8d5c2",
    backgroundColor: "#eaf3ec",
    marginVertical: 3,
  },
  buttonText: { fontSize: 14, color: "#164b32", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#b8cebf",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    color: "#153525",
  },
  label: { fontSize: 12, color: "#51685a", marginBottom: 7 },
  hero: {
    backgroundColor: "#174532",
    padding: 26,
    borderRadius: 18,
    marginBottom: 12,
  },
  heroText: { fontSize: 30, color: "#fff", fontWeight: "700" },
  notice: { padding: 16, backgroundColor: "#fff0cc", borderRadius: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pass: {
    fontFamily: "monospace",
    fontSize: 13,
    padding: 12,
    backgroundColor: "#eef5ed",
  },
});
