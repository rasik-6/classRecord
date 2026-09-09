'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface WorkoutClass {
  id: string;
  title: string;
  date: string;
  details: string;
  image_url: string | null;
  reference_url: string | null;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  file_name: string;
  notes: string;
  created_at: string;
}

export default function Home() {
  const [classes, setClasses] = useState<WorkoutClass[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const [classTitle, setClassTitle] = useState('');
  const [classDate, setClassDate] = useState('');
  const [classDetails, setClassDetails] = useState('');
  const [classImage, setClassImage] = useState<File | null>(null);
  const [classReferenceUrl, setClassReferenceUrl] = useState('');
  const [classSubmitting, setClassSubmitting] = useState(false);

  const [videoTitle, setVideoTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoNotes, setVideoNotes] = useState('');
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string>('');

  useEffect(() => {
    loadClasses();
    loadVideos();
  }, []);

  async function loadClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading classes:', error);
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  }

  async function loadVideos() {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading videos:', error);
    } else {
      setVideos(data || []);
    }
  }

  async function handleClassSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classTitle.trim()) return;

    setClassSubmitting(true);

    let imageUrl: string | null = null;

    if (classImage) {
      const fileExt = classImage.name.split('.').pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('class-images')
        .upload(filePath, classImage);

      if (uploadError) {
        console.error('Image upload failed:', uploadError);
        alert('Image upload failed. Check the console for details.');
        setClassSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('class-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('classes').insert({
      title: classTitle.trim(),
      date: classDate.trim(),
      details: classDetails.trim(),
      image_url: imageUrl,
      reference_url: classReferenceUrl.trim() || null,
    });

    if (insertError) {
      console.error('Error saving class:', insertError);
      alert('Could not save the class. Check the console for details.');
    } else {
      setClassTitle('');
      setClassDate('');
      setClassDetails('');
      setClassImage(null);
      setClassReferenceUrl('');
      const imageInput = document.getElementById('class-image-input') as HTMLInputElement | null;
      if (imageInput) imageInput.value = '';
      loadClasses();
    }

    setClassSubmitting(false);
  }

  async function handleVideoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoTitle.trim() || !videoFile) return;

    setVideoSubmitting(true);
    setVideoUploadProgress('Uploading video…');

    const fileExt = videoFile.name.split('.').pop();
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('class-videos')
      .upload(filePath, videoFile);

    if (uploadError) {
      console.error('Video upload failed:', uploadError);
      alert('Video upload failed. Check the console for details.');
      setVideoSubmitting(false);
      setVideoUploadProgress('');
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('class-videos')
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('videos').insert({
      title: videoTitle.trim(),
      video_url: publicUrlData.publicUrl,
      file_name: videoFile.name,
      notes: videoNotes.trim(),
    });

    if (insertError) {
      console.error('Error saving video:', insertError);
      alert('Could not save the video. Check the console for details.');
    } else {
      setVideoTitle('');
      setVideoFile(null);
      setVideoNotes('');
      const fileInput = document.getElementById('video-file-input') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      loadVideos();
    }

    setVideoSubmitting(false);
    setVideoUploadProgress('');
  }

  async function removeClass(id: string) {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) {
      console.error('Error deleting class:', error);
    } else {
      setClasses(classes.filter((c) => c.id !== id));
    }
  }

  async function removeVideo(id: string) {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) {
      console.error('Error deleting video:', error);
    } else {
      setVideos(videos.filter((v) => v.id !== id));
    }
  }

  if (loading) {
    return (
      <main>
        <p className="empty-note">Loading…</p>
      </main>
    );
  }

  return (
    <>
      <header className="site-header">
        <span className="brand-mark">●</span>
        <div>
          <p className="site-kicker">planning board</p>
          <h1 className="site-title">Class &amp; Video Planner</h1>
        </div>
      </header>

      <main>
        <section className="board" id="workouts">
          <div className="board-head">
            <h2>Workouts</h2>
            <p className="board-sub">Sketch out classes before they&apos;re ready to announce.</p>
          </div>

          <form className="entry-form" onSubmit={handleClassSubmit}>
            <div className="field-row">
              <input
                type="text"
                placeholder="Class name — e.g. Sunrise Kettlebell Flow"
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Target date (optional)"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
              />
            </div>
            <textarea
              rows={3}
              placeholder="What happens in this class? Format, length, who it's for..."
              value={classDetails}
              onChange={(e) => setClassDetails(e.target.value)}
            />
            <input
              type="url"
              placeholder="YouTube reference link (optional) — video you're improvising from"
              value={classReferenceUrl}
              onChange={(e) => setClassReferenceUrl(e.target.value)}
            />
            <label className="file-label">
              Reference photo (optional)
              <input
                id="class-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => setClassImage(e.target.files?.[0] || null)}
              />
            </label>
            <button type="submit" disabled={classSubmitting}>
              {classSubmitting ? 'Saving…' : 'Add class'}
            </button>
          </form>

          <ul className="entry-list">
            {classes.map((c) => (
              <li className="entry-card" key={c.id}>
                <div className="entry-main">
                  {c.date && <span className="entry-meta">{c.date}</span>}
                  <p className="entry-title">{c.title}</p>
                  {c.details && <p className="entry-details">{c.details}</p>}
                  {c.image_url && (
                    <img className="entry-image" src={c.image_url} alt={c.title} />
                  )}
                  {c.reference_url && (
                    <a className="entry-link" href={c.reference_url} target="_blank" rel="noopener noreferrer">
                      Reference video ↗
                    </a>
                  )}
                </div>
                <button className="remove-btn" onClick={() => removeClass(c.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {classes.length === 0 && (
            <p className="empty-note">No classes sketched out yet — add your first one above.</p>
          )}
        </section>

        <section className="board" id="unreleased-vids">
          <div className="board-head">
            <h2>Unreleased Vids</h2>
            <p className="board-sub">Upload a video and hold notes until it&apos;s ready to publish.</p>
          </div>

          <form className="entry-form" onSubmit={handleVideoSubmit}>
            <input
              type="text"
              placeholder="Video title — e.g. Mobility Warmup Cut"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              required
            />
            <input
              id="video-file-input"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              required
            />
            <textarea
              rows={3}
              placeholder="Editing notes, release plans, anything to remember..."
              value={videoNotes}
              onChange={(e) => setVideoNotes(e.target.value)}
            />
            <button type="submit" disabled={videoSubmitting}>
              {videoSubmitting ? (videoUploadProgress || 'Saving…') : 'Add video'}
            </button>
          </form>

          <ul className="entry-list">
            {videos.map((v) => (
              <li className="entry-card" key={v.id}>
                <div className="entry-main">
                  <p className="entry-title">{v.title}</p>
                  {v.notes && <p className="entry-details">{v.notes}</p>}
                  <video className="entry-video" src={v.video_url} controls preload="metadata" />
                  <p className="entry-filename">{v.file_name}</p>
                </div>
                <button className="remove-btn" onClick={() => removeVideo(v.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {videos.length === 0 && (
            <p className="empty-note">No videos stashed yet — add your first one above.</p>
          )}
        </section>
      </main>
    </>
  );
}