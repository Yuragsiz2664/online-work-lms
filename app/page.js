'use client';
import { useEffect, useState } from 'react';
import { supabase, ADMIN_ID } from '../lib/supabase';
import { BookOpen, PlayCircle, CheckCircle, Lock, PlusCircle, ShieldCheck, CreditCard } from 'lucide-react';

export default function LMSApp() {
  const [tgUser, setTgUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [tab, setTab] = useState('courses');
  const [loading, setLoading] = useState(true);

  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: '' });
  const [newLesson, setNewLesson] = useState({ course_id: '', title: '', video_url: '', homework_task: '' });
  const [pendingPayments, setPendingPayments] = useState([]);

  const isAdmin = tgUser?.id === ADMIN_ID;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();
      const user = webApp.initDataUnsafe?.user || { id: ADMIN_ID, first_name: 'Admin' };
      setTgUser(user);
      initUser(user);
    }
  }, []);

  async function initUser(user) {
    await supabase.from('users').upsert({
      telegram_id: user.id,
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      username: user.username || '',
      is_admin: user.id === ADMIN_ID,
    });
    await fetchData(user.id);
    setLoading(false);
  }

  async function fetchData(userId) {
    const { data: coursesData } = await supabase.from('courses').select('*').order('created_at');
    setCourses(coursesData || []);

    const { data: enrollData } = await supabase.from('enrollments').select('*').eq('user_id', userId);
    setEnrollments(enrollData || []);

    if (userId === ADMIN_ID) {
      const { data: allPending } = await supabase
        .from('enrollments')
        .select('*, users(full_name, username), courses(title, price)')
        .eq('status', 'pending');
      setPendingPayments(allPending || []);
    }
  }

  async function openCourse(course) {
    setSelectedCourse(course);
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', course.id)
      .order('order_index');
    setLessons(data || []);
    if (data && data.length > 0) setActiveLesson(data[0]);
  }

  async function requestEnrollment(courseId) {
    await supabase.from('enrollments').insert({
      user_id: tgUser.id,
      course_id: courseId,
      status: 'pending',
    });
    alert("So'rov yuborildi! Endi botga to'lov chekini (skrinshot) yuboring. Admin tasdiqlashi bilan darslar ochiladi.");
    fetchData(tgUser.id);
  }

  async function handleAddCourse(e) {
    e.preventDefault();
    if (!newCourse.title || !newCourse.price) return;
    await supabase.from('courses').insert({
      title: newCourse.title,
      description: newCourse.description,
      price: parseInt(newCourse.price),
    });
    setNewCourse({ title: '', description: '', price: '' });
    alert("Yangi kurs qo'shildi!");
    fetchData(tgUser.id);
  }

  async function handleAddLesson(e) {
    e.preventDefault();
    if (!newLesson.course_id || !newLesson.title || !newLesson.video_url) return;
    await supabase.from('lessons').insert({
      course_id: newLesson.course_id,
      title: newLesson.title,
      video_url: newLesson.video_url,
      homework_task: newLesson.homework_task,
    });
    setNewLesson({ course_id: '', title: '', video_url: '', homework_task: '' });
    alert("Yangi dars qo'shildi!");
  }

  async function approvePayment(enrollId) {
    await supabase.from('enrollments').update({ status: 'approved' }).eq('id', enrollId);
    alert("To'lov tasdiqlandi, o'quvchiga kurs ochildi!");
    fetchData(tgUser.id);
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Platforma yuklanmoqda...</div>;

  return (
    <div className="max-w-xl mx-auto p-4 pb-20">
      <header className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">Online Work Academy</h1>
          <p className="text-xs text-slate-400">Xush kelibsiz, {tgUser?.first_name}!</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setSelectedCourse(null); setTab(tab === 'admin' ? 'courses' : 'admin'); }}
            className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-medium"
          >
            <ShieldCheck className="w-4 h-4" />
            {tab === 'admin' ? 'Kurslarga qaytish' : 'Admin Panel'}
          </button>
        )}
      </header>

      {tab === 'admin' && isAdmin ? (
        <div className="space-y-6">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h2 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Tasdiqlash kutilayotgan to'lovlar ({pendingPayments.length})
            </h2>
            {pendingPayments.length === 0 ? (
              <p className="text-xs text-slate-500">Hozircha yangi to'lov so'rovlari yo'q.</p>
            ) : (
              pendingPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg mb-2 border border-slate-800">
                  <div>
                    <p className="text-sm font-medium">{p.users?.full_name} (@{p.users?.username})</p>
                    <p className="text-xs text-slate-400">{p.courses?.title} — {p.courses?.price?.toLocaleString()} so'm</p>
                  </div>
                  <button
                    onClick={() => approvePayment(p.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs px-3 py-1.5 rounded-lg font-medium"
                  >
                    Tasdiqlash
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddCourse} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <h2 className="font-semibold text-emerald-400 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Yangi kurs qo'shish
            </h2>
            <input
              type="text"
              placeholder="Kurs nomi"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
            />
            <textarea
              placeholder="Kurs haqida qisqacha"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
            />
            <input
              type="number"
              placeholder="Narxi (so'mda, masalan: 150000)"
              value={newCourse.price}
              onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
            />
            <button type="submit" className="w-full bg-emerald-600 py-2.5 rounded-lg text-sm font-semibold">
              Kursni saqlash
            </button>
          </form>

          <form onSubmit={handleAddLesson} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <h2 className="font-semibold text-sky-400 flex items-center gap-2">
              <PlayCircle className="w-4 h-4" /> Kursga video dars qo'shish
            </h2>
            <select
              value={newLesson.course_id}
              onChange={(e) => setNewLesson({ ...newLesson, course_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
            >
              <option value="">Kursni tanlang...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Dars mavzusi (masalan: 1-dars. Kirish)"
              value={newLesson.title}
              onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
            />
            <input
              type="text"
              placeholder="Video havolasi (YouTube Embed yoki Kinescope/Bunny URL)"
              value={newLesson.video_url}
              onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
            />
            <input
              type="text"
              placeholder="Uy vazifasi matni (ixtiyoriy)"
              value={newLesson.homework_task}
              onChange={(e) => setNewLesson({ ...newLesson, homework_task: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm"
            />
            <button type="submit" className="w-full bg-sky-600 py-2.5 rounded-lg text-sm font-semibold">
              Darsni qo'shish
            </button>
          </form>
        </div>
      ) : selectedCourse ? (
        <div>
          <button onClick={() => setSelectedCourse(null)} className="text-xs text-slate-400 mb-4 hover:text-white">
            ← Barcha kurslarga qaytish
          </button>
          <h2 className="text-lg font-bold mb-3">{selectedCourse.title}</h2>

          {activeLesson ? (
            <div className="mb-6">
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 mb-3">
                <iframe
                  src={activeLesson.video_url}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
              <h3 className="font-semibold text-base">{activeLesson.title}</h3>
              {activeLesson.homework_task && (
                <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                  <strong className="text-emerald-400">Uy vazifasi:</strong> {activeLesson.homework_task}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-4">Bu kursga hali darslar yuklanmagan.</p>
          )}

          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Darslar ro'yxati</h4>
            {lessons.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 ${
                  activeLesson?.id === lesson.id
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <PlayCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{idx + 1}. {lesson.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Mavjud kurslar
          </h2>

          {courses.map((course) => {
            const enrollment = enrollments.find((e) => e.course_id === course.id);
            const isApproved = enrollment?.status === 'approved' || isAdmin;
            const isPending = enrollment?.status === 'pending';

            return (
              <div key={course.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-base text-white">{course.title}</h3>
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                    {course.price.toLocaleString()} so'm
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{course.description}</p>

                {isApproved ? (
                  <button
                    onClick={() => openCourse(course)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Darslarni boshlash
                  </button>
                ) : isPending ? (
                  <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 py-2.5 rounded-xl text-xs text-center font-medium">
                    To'lov tekshirilmoqda... Chekni botga yuboring
                  </div>
                ) : (
                  <button
                    onClick={() => requestEnrollment(course.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-amber-400" /> Kursni sotib olish
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
