-- SUPABASE SETUP SCRIPT FOR FLIXON

CREATE TABLE IF NOT EXISTS movies (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_id TEXT,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  tx_ref TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO admin_settings (setting_key, setting_value) VALUES
('flutterwave_public_key', ''),
('flutterwave_secret_key', ''),
('flutterwave_webhook_secret', '')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO movies (id, title, description, type, thumbnail_url, video_url, created_at) VALUES
(8010, 'Kraken- VJ ICE P', '', 'video', 'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/Kraken.jpg', 'https://jimmy.pearlpix.xyz/SERIES%2010/SINGLES/Kraken.2026.mp4', '2026-07-22 14:23:16'),
(8011, 'Blades Of The Guardians Wind Rises In The Desert-  ICE P', '', 'video', 'https://www.flickeringmyth.com/?attachment_id=1976570', 'https://jimmy.pearlpix.xyz/SERIES%2010/SINGLES/2/Blades.Of.The.Guardians.Wind.Rises.In.The.Desert.ICE%20P.mp4', '2026-07-22 14:18:19'),
(8013, 'BLADES OF THE GUARDIANS - EMMY', '', 'video', 'https://static0.moviewebimages.com/wordpress/wp-content/uploads/2026/02/bofg-1340x754-1-jpg.webp?q=49&fit=contain&w=1340&h=754&dpr=2', 'https://jimmy.pearlpix.xyz/SERIES%2010/SINGLES/2/BLADES%20OF%20THE%20GUARDIANS%20EMMY.2026.mp4', '2026-07-22 14:14:42'),
(8014, 'OVER DEAD BODY - VJ EMMY', '', 'video', 'https://i.ytimg.com/vi/bAndhJJmjI4/maxresdefault.jpg', 'https://jimmy.pearlpix.xyz/JUNE%20/OVER%20DEAD%20BODY%20EMMY.2026.mp4', '2026-07-22 12:53:44'),
(7971, 'THE COLLATERAL - VJ ULIO', '', 'video', 'https://benjweinberg.com/wp-content/uploads/2017/03/maxresdefault.jpg?w=1200', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/MAY/SERIES/THE%20COLLATERAL___VJ%20ULIO.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-07-09 07:57:44'),
(7999, 'IN THE GREY - VJ JUNIOR', '', 'video', 'https://whentostream.com/wp-content/uploads/2026/05/In-the-Grey-Horizontal-10.jpg', 'https://jimmy.pearlpix.xyz/JUNE%20/IN%20THE%20GREY%20JR.2026.mp4', '2026-06-19 03:20:17'),
(8000, 'THE PHYSICIAN - VJ ULIO', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/3a9b7b13a0b5a232d7b68292d4fce3288f09fdf2478a922c2a84039da3365cb7.jpg', 'https://jimmy.pearlpix.xyz/JUNE/spider/THE%20PHYSICIAN%202026%20VJ%20ULIO%201080p%20(NO%20S).mp4', '2026-06-19 03:15:22'),
(8001, 'DEREST WARRIOR - VJ JUNIOR', '', 'video', 'https://whentostream.com/wp-content/uploads/2026/05/Desert-Warrior-Horizontal-10.jpeg', 'https://jimmy.pearlpix.xyz/JUNE%20/DEREST%20WARRIOR%20JR.2026.mp4', '2026-06-19 03:07:56'),
(7975, 'TOM CLANCYS JACK RYAN - VJ ICE P', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/5b4ae0efa96c09972da167f70b30f4f723fa0b4b99d5b85fd1c3ab266468fef8.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/MAY/SERIES/TOM%20CLANCYS%20JACK%20RYAN___VJ%20ICE%20P.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-06-10 03:34:16'),
(7974, 'MORTAL KOMBAT 2 - VJ EMMY', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/360ee32d95e57b064ca1cbe2f990c6b1f983c0d032095b83f8fdc649f5ea725c._UR1920,1080_SX624_FMjpg_.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/MAY/SERIES/MORTAL%20KOMBAT%202%20EMMY.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-06-10 03:28:33'),
(7961, 'Driver''s Ed -  VJ ULIO', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/d53257d951fe05de3e2469aad0109f392600927aa796a4f323b5abea7bc6192d.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/MAY/SERIES/THE%20DRIVER%20S%20ED___VJ%20ULIO.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-05-28 12:31:44'),
(7960, 'THE COLLATERAL - VJ ULIO', '', 'video', 'https://benjweinberg.com/wp-content/uploads/2017/03/maxresdefault.jpg?w=1200', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/MAY/SERIES/THE%20COLLATERAL___VJ%20ULIO.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-05-28 12:28:12'),
(7909, 'Blade Warrior of Blade Action - ICE P', '', 'video', 'https://image.tmdb.org/t/p/original/qDVVmV8fpZyUkszvR8I6lnVeI5p.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/4/Blade%20Warrior%20of%20Blade%20Action%20ICE%20P%202026.mp4', '2026-05-23 13:35:38'),
(7912, 'BALISTIC -  VJ HAM', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/a8fdb85e2155a20eb9a7b1ef2f9d69391684e7a02bc539f929bbe4183316feb8.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/MAY/MOVIES/5/BALISTIC_VJ%20HAM%202026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-05-23 13:28:54'),
(7911, 'NORMAL - VJ JUNIOR', '', 'video', 'https://cdn.theplaylist.net/wp-content/uploads/2026/02/19111308/normal-bob-odenkirk.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/MAY/MOVIES/5/NORMAL%20JR.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-05-23 13:11:33'),
(7910, 'FIST TO FIST - VJ JUNIOR', '', 'video', 'https://gbaike-image.cdn.bcebos.com/8694a4c27d1ed21b0ef4b556a136cac451da81cb9172/8694a4c27d1ed21b0ef4b556a136cac451da81cb9172_url?x-bce-process=image/format,f_auto/resize,m_lfit,w_400,limit_1', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/MAY/MOVIES/5/FIST%20TO%20%20FIST%20JR.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-05-23 13:07:15'),
(7905, 'LIMIT- VJ ULIO', '', 'video', 'https://i.ytimg.com/vi/Wu5O9KZnUWc/maxresdefault.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/4/LIMIT%202026%20VJ%20ULIO%201080p%20(NO%20S).mp4', '2026-05-22 18:25:45'),
(7906, 'YOU ME AND TUSCANY - VJ JUNIOR', '', 'video', 'https://universalpictures.ca/wp-content/uploads/2025/11/Universal_HomeMainCarousel_1920x1025-3.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/4/YOU%20ME%20AND%20TUSCANY%20JR.2026.mp4', '2026-05-22 18:08:03'),
(7907, 'GIANT - VJ JUNIOR', '', 'video', 'https://amayei.nyc3.digitaloceanspaces.com/2025/10/IMG-20251018-WA0002-674x470.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/4/GIANT%20JR.2026.mp4', '2026-05-22 18:05:39'),
(7873, 'BEAST - VJ JUNIOR', '', 'video', 'https://m.media-amazon.com/images/M/MV5BYjQ0OTgwZGUtNDhlYi00ZTM5LWI2NmYtNGYwYWJhNzVlYTc5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/4/BEAST%20JR.2026.mp4', '2026-05-17 17:32:42'),
(7868, 'KILLCODE - VJ SHIELD', '', 'video', 'https://m.media-amazon.com/images/M/MV5BNDJiNjM3OWEtZDc1Yy00ZGY2LWIyMzAtNzg5NmY1MmU3MDE0XkEyXkFqcGc@._V1_QL75_UX500_CR0,26,500,281_.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/KILLCODE___VJ%20SHIELD.2026.mp4', '2026-05-17 17:29:11'),
(7872, 'FACES OF DEATH - VJ JUNIOR', '', 'video', 'https://beardedgentlemenmusic.com/wp-content/uploads/2026/04/FoD3.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/4/FACES%20OF%20DEATH%20JR.2026.mp4', '2026-05-17 17:25:52'),
(7871, 'Fred 2: Night of the Living Fred - VJ SOUL', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/e762587e40992616826e5abc6d0c5371ce8f0ae168a05cceb453be1f23d4b398.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/3/FRED%202%20NIGHT%20OF%20THE%20LIVING%20FRED%20VJ%20SOUL.AM24_7.2026.mp4', '2026-05-17 17:23:23'),
(7870, 'TIMUR - VJ ICE P', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/ce3dbe0471365a17565aa0a965fec4326bf9f06125151f832f560484a86968ea.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/TIMUR%202026%20VJ%20ICE%20P%201080p%20(NO%20S).mp4', '2026-05-17 17:20:57'),
(7859, 'MERCURY RISING -  VJ ULIO', '', 'video', 'https://is1-ssl.mzstatic.com/image/thumb/MSg_8e2hgG5at8AcZ06SJw/1200x675.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/MERCURY%20RISING%20VJ.ULIO.mp4', '2026-05-10 22:44:31'),
(7860, 'MY DEAREST ASSASSIN -VJ JUNIOR', '', 'video', 'https://i.ytimg.com/vi/M7--LSAvW48/mqdefault.jpg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/MY%20DEAREST%20ASSASSIN%20JR.2026.mp4', '2026-05-10 22:38:53'),
(7861, 'PANDA PLAN - VJ JUNIOR', '', 'video', 'https://i0.wp.com/maactioncinema.com/wp-content/uploads/2024/10/AA1rJyYm.jpg?fit=768%2C432&ssl=1', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/PANDA%20PLAN%201%20JR.2026.mp4', '2026-05-10 22:32:26'),
(7862, 'NO ORDINARY HIEST - VJ JUNIOR', '', 'video', 'https://miro.medium.com/1*2gkPZ0QYChVvebi6Kd9Anw.jpeg', 'https://jimmy.pearlpix.xyz/MAY/MOVIES/NO%20ORDINARY%20HIEST%20JR.2026.mp4', '2026-05-10 22:29:06'),
(7858, 'BROTHERS UNDER FIRE', '', 'genesis_free_movie', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzxapuXzwUIdLQFTGBfn6-FjSpoXcaiHfgjA&s', '', '2026-05-10 17:49:34'),
(7857, 'APEX - VJ JUNIOR', '', 'genesis_free_movie', 'https://horrornewsnetwork.net/wp-content/uploads/2026/03/Apex.jpg', '', '2026-05-10 17:48:53'),
(7844, 'Yogida part 1', '', 'video', 'https://assets-in.bmscdn.com/discovery-catalog/events/et00483822-wjkqrzmufd-landscape.jpg', 'https://jimmy.pearlpix.xyz/APIRL/2/Yogida%20part%201__Merged.mp4', '2026-05-08 22:57:58'),
(7845, 'KRAKEN- VJ EMMY', '', 'video', 'https://www.lifeinnorway.net/wp-content/uploads/2026/05/kraken-movie-promotional-image.jpg', 'https://jimmy.pearlpix.xyz/APIRL/KRAKEN%202026%20VJ%20EMMY%201080p%20(NO%20S).mp4', '2026-05-08 22:50:53'),
(7846, 'THEY WILL KILL YOU - VJ EMMY', '', 'video', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUCcZlIaSKcDmRRN6IxVFz8fw-E_YDKTFoQw&s', 'https://jimmy.pearlpix.xyz/APIRL/THEY%20WILL%20KILL%20YOU%202026%20VJ%20EMMY%201080p%20(NO%20S).mp4', '2026-05-08 22:47:11'),
(7847, 'PROJET HAIL MRY - VJ JUNIOR', '', 'video', 'https://thelinfieldreview.com/wp-content/uploads/2026/04/Project-Hail-Mary-Header-FUTURE-OF-THE-FORCE.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://jimmy.pearlpix.xyz/APIRL/PROJET%20HAIL%20MRY%202026%20JR%201080p%20(NO%20S).mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-05-08 22:43:15'),
(7828, 'PROTECTOR - VJ JUNIOR', '', 'video', 'https://whentostream.com/wp-content/uploads/2026/04/Protector-Horizontal-10.jpeg', 'https://jimmy.pearlpix.xyz/APIRL/PROTECTOR%20JR.2026.mp4', '2026-05-06 19:20:55'),
(7826, 'HIVE - VJ SOUL', '', 'video', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIHhfJh7QcH9DCUFvK0fUhAm-8FLxWaBP3Ag&s', 'https://jimmy.pearlpix.xyz/APRIL%20SERIES/WATCHING%20YOU/HIVE%202026%20VJ%20SOUL%201080p%20(NO%20S).mp4', '2026-05-06 19:14:21'),
(7831, 'TEEN LUST  - VJ EMMY', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/0dc45636f7850fd95e0e1f629de06cffb604b4bae7116a87f7893fb3139e52e5.jpg', 'https://jimmy.pearlpix.xyz/APIRL/TEEN%20LUST%202026%20VJ%20EMMY%201080p%20(NO%20S).mp4', '2026-05-04 22:45:34'),
(7829, 'THEY WILL KILL YOU - VJ JUNIOR', '', 'video', 'https://whentostream.com/wp-content/uploads/2026/01/They-Will-Kill-You-Horizontal-1-1.jpeg', 'https://jimmy.pearlpix.xyz/APIRL/THEY%20WILL%20KILL%20YOU%20JR.2026.mp4', '2026-05-04 22:44:19'),
(7830, 'VEGANZA - VJ JUNIOR', '', 'video', 'https://i.ytimg.com/vi/nj6p2abJnQI/hqdefault.jpg', 'https://jimmy.pearlpix.xyz/APIRL/VEGANZA%20JR.2026.mp4', '2026-05-04 22:41:38'),
(7825, 'THE CARETAKER - VJ HAM', '', 'video', 'https://i.ytimg.com/vi/HTb_VxHhSps/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDH6LcG62aP91oEjGcZ2Mu2DTUciQ', 'https://jimmy.pearlpix.xyz/APRIL%20SERIES/WATCHING%20YOU/THE%20CARETAKER%20_%20VJ%20HAM%202026.mp4', '2026-05-04 22:35:49'),
(7835, 'CARTER ICEP', '', 'genesis_free_movie', 'https://decider.com/wp-content/uploads/2022/08/CARTER-2022-NETFLIX-MOVIE-REVIEW.jpg?quality=75&strip=all&w=1200', '', '2026-05-04 22:10:19'),
(7834, 'IF I RUN - VJ JUNIOR', '', 'genesis_free_movie', 'https://flixon.net/wp-content/uploads/2025/10/VJICS46QWRECJJGVQJGZOHE4KE.avif', '', '2026-05-04 22:09:59'),
(7833, 'HUNTING JESSICA BROK - VJ JOVAN', '', 'genesis_free_movie', 'https://flixon.net/wp-content/uploads/2026/01/Hunting-Jessica-Brok-2025.jpg', '', '2026-05-04 22:09:27'),
(7832, 'CRIME 101 - VJ Emmy', '', 'genesis_free_movie', 'https://flixon.net/wp-content/uploads/2026/03/d94fd71a13228969645057caee363324.webp', '', '2026-05-04 22:07:56'),
(7810, 'ONCE IN A VALENTINE - VJ HAM', '', 'video', 'https://stz1.imgix.net/web/contentId/72180/type/KEY/dimension/2560x1440/lang/en-US', 'https://jimmy.pearlpix.xyz/APRIL%20SERIES/WATCHING%20YOU/VJ%20HAM%20ONCE-IN-A-VALENTINE_2026.mp4', '2026-05-03 23:25:03'),
(7809, 'THE WANDERING EARTH 2 -  VJ ULIO', '', 'video', 'https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/9c/4f/31/9c4f31c6-74ee-7c1d-71c9-2eb666439288/6b849cfb-2514-4c9b-8ca8-1258ccb612ee_TheWanderingEarth2_CoverArt_en.jpg/1200x675.jpg', 'https://jimmy.pearlpix.xyz/APIRL/THE%20WANDERING%20EARTH%202%20VJ%20ULIO%202023.mp4', '2026-05-03 23:19:03'),
(7808, 'INFILTRATE - VJ EMMY', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/2dea23a5d0b162be74c1abd5cb7d6209f3502a4a8fff7ec6f52ffdc98a94a931.jpg', 'https://jimmy.pearlpix.xyz/APIRL/INFILTRATE%20EMMY.2026.mp4', '2026-05-03 23:16:03'),
(7807, 'BROTHERS UNDER FIRE - VJ EMMY', '', 'video', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6WMte0TwfioW-9LPDN8iYpEGr9f6e15BYcg&s', 'https://jimmy.pearlpix.xyz/APIRL/BROTHERS%20UNDER%20FIRE%20EMMY.2026.mp4', '2026-05-03 23:13:02'),
(7806, 'HUMINT - VJ JUNIOR', '', 'video', 'https://www.chosun.com/resizer/v2/GM3TQNLBMU4DGMJVHFSWEN3DGE.jpg?auth=17618bd98c5f5c0d89c71006f03f09006136ccbe9dec9980b8a42620461fc1b6&width=616', 'https://jimmy.pearlpix.xyz/APIRL/HUMINT%202026%20JR%201080p%20(NO%20S).mp4', '2026-05-03 23:09:04'),
(7799, 'Reminders of Him - VJ Junior', '', 'video', 'https://cdn.district.in/movies-assets/images/cinema/Reminders-of-Him_Horizontal_Poster2-0cb96800-afee-11f0-9318-6f61d3ca5f7f.jpg?im=Resize,width=720', 'https://jimmy.pearlpix.xyz/APIRL/REMINDERS%20OF%20HIM%20JR.2026.mp4', '2026-05-03 15:40:20'),
(7730, 'APEX - VJ JUNIOR', '', 'video', 'https://i0.wp.com/movizark.com/wp-content/uploads/2026/04/AAAABSeaoBs3DPsQ7GOX4DXVJLhSktrS55aPsSvx9rLhq3UWW2O5uMr6ZM7xsD25Xr0UW.jpg?resize=1500%2C768&ssl=1', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/APEX___VJ%20JR.2026.mkv">Your browser does not support HTML5 video.</video></div>', '2026-04-27 09:37:12'),
(7729, 'READY OR NOT HERE I COME - VJ JUNIOR', '', 'video', 'https://whentostream.com/wp-content/uploads/2025/12/Ready-or-Not-2-Here-I-Come-Horizontal-10.jpeg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/READY%20OR%20NOT%20HERE%20I%20COME%20JR.2026.mkv">Your browser does not support HTML5 video.</video></div>', '2026-04-27 09:28:02'),
(7731, 'BALLS UP - VJ EMMY', '', 'video', 'https://www.tvguide.com/a/img/catalog/provider/2/13/2-2867925d37fec813113f233dcca2a876.jpg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/BALLS%20UP%20EMMY.2026.mkv">Your browser does not support HTML5 video.</video></div>', '2026-04-27 09:24:00'),
(7732, 'FRACTURED- VJ ULIO', '', 'video', 'https://www.heavenofhorror.com/wp-content/uploads/2019/09/fractured-netflix-review.jpg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/FRACTURED%20___ULIO.2026.mkv">Your browser does not support HTML5 video.</video></div>', '2026-04-27 09:19:39'),
(7733, 'BROTHERS UNDER FIRE JR.2026', '', 'video', 'https://is1-ssl.mzstatic.com/image/thumb/Video221/v4/15/ff/45/15ff4513-e1ce-dc69-9289-fe2252265ee4/BrothersUnderFire_iTunes_CoverArt_3840x2160.png/1200x675.jpg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/BROTHERS%20UNDER%20FIRE%20JR.2026.mkv">Your browser does not support HTML5 video.</video></div>', '2026-04-27 09:15:26'),
(7725, 'Vantage Point - VJ Junior', '', 'video', 'https://beam-images.warnermediacdn.com/BEAM_LWM_DELIVERABLES/f30d665f-4565-4811-91a3-e21ffeae7035/b72304652d87d431c14716b8493d5c91dd230c6d.jpg?host=wbd-images.prod-vod.h264.io&partner=beamcom', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/Vantage%20Point%20Jr.2026.mp4">Your browser does not support HTML5 video.</video></div>', '2026-04-26 22:14:07'),
(7707, 'CRIME 101 - VJ Emmy', '', 'video', 'https://i.ytimg.com/vi/h41g5V_eZYM/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDIFwGfBvpjasl-l9wHzlABkJRsJg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/CRIME_101_EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-04-25 11:22:19'),
(7702, 'PIZZA MOVIE - VJ SOUL', '', 'video', 'https://i.ytimg.com/vi/rq1SdkU9NdE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAVlQLaHlAqqSFAmp8P4Z-kLiQ_Jg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/PIZZA_MOVIE_SOUL.mp4">Your browser does not support HTML5 video.</video></div>', '2026-04-24 00:58:02'),
(7700, 'CARTER ICEP', '', 'video', 'https://maactioncinema.com/wp-content/uploads/2022/08/carter-movie-netflix-compressed.jpg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/CARTER_ICEP.mp4">Your browser does not support HTML5 video.</video></div>', '2026-04-24 00:04:12'),
(7698, 'AGENT ZETA - VJ ULIO', '', 'video', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRalQP-IGNfdWQhhVw4B4DJAvF1iHLTbOe5iQ&s', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/AGENT_ZETA_ULIO.mp4">Your browser does not support HTML5 video.</video></div>', '2026-04-23 23:56:36'),
(7696, 'THE PROTECTOR - VJ EMMY', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/24964027be60371571c2845b0a49ff176ee5018068ee6c09339b8045099ad973.jpg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/THE_PROTECTOR_EMMY.mp4">Your browser does not support HTML5 video.</video></div>', '2026-04-23 23:51:56'),
(7694, 'THRASH - VJ EMMY', '', 'video', 'https://www.hexflicks.com/wp-content/uploads/2026/04/thrash-2026.jpeg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/THRASH_EMMY.mp4">Your browser does not support HTML5 video.</video></div>', '2026-04-23 23:45:03'),
(7689, 'SECRET OBSESSION - VJ JUNIOR', '', 'video', 'https://www.heavenofhorror.com/wp-content/uploads/2019/07/Secret-Obsession-netflix-review-1200x676.jpg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/SECRET_OBSESSION_JR.mp4">Your browser does not support HTML5 video.</video></div>', '2026-04-23 01:32:45'),
(7687, 'SNIPER NO NATION - VJ JUNIOR', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/ffa6377353db0f0ac71649db72cbce10170cb619afeb94b640915bdf7d35a740.jpg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/SNIPER%20NO%20NATION%20JR.2026.mkv">Your browser does not support HTML5 video.</video></div>', '2026-04-23 01:20:08'),
(7682, 'THE KEEPING ROOM-  VJ JUNIOR', '', 'video', 'https://is1-ssl.mzstatic.com/image/thumb/Video114/v4/16/74/41/16744189-823f-15fc-01e6-4126cf1d045c/1119644815-WW-AMP_SF.lsr/1200x675.jpg', '<div style="position:relative;width:100%;padding-top:56.25%;overflow:hidden;"><video controls preload="metadata" playsinline style="position:absolute;top:0;left:0;width:100%;height:100%;"><source src="https://cdn.flixon.net/THE_KEEPING_ROOM_JR.mp4">Your browser does not support HTML5 video.</video></div>', '2026-04-19 03:41:32'),
(7669, 'JIU JITSU - VJ ICEP', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/a1c2fd1fb40143141a323e29311b8f4365a6b41054c7fd300f5decc6d4eeda36._SX1080_FMjpg_.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/JIU_JITSU_ICEP.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-19 01:31:33'),
(7667, 'THE KING IVORY - VJ ULIO', '', 'video', 'https://img3.hulu.com/user/v3/artwork/55a547bd-6ab2-4862-af82-6dbf8b7b3918?base_image_bucket_name=image_manager&base_image=019cc4b8-126e-7895-960c-e400dbbcb088&region=US&format=webp&size=952x536', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE_KING_IVORY_ULIO.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-19 01:24:33'),
(7665, 'THE SAVAGE SALVATION - VJ JUNIOR', '', 'video', 'https://images.plex.tv/photo?size=large-1280&url=https%3A%2F%2Fmetadata-static.plex.tv%2Fa%2Fgracenote%2Fae3a5a2c7efbdd51df340db734294f5b.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE_SAVAGE_SALVATION_JR.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-19 01:11:38'),
(7663, 'SHELTER - VJ JUNIOR', '', 'video', 'https://i0.wp.com/thefutureoftheforce.com/wp-content/uploads/2026/01/Jason-Statham-Shelter-Review-2026.jpg?fit=1920%2C1080&ssl=1', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/SHELTER_JR.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-18 00:41:44'),
(7660, 'THE RACE - VJ MOSCO', '', 'video', 'https://lh5.googleusercontent.com/proxy/YBQObd2qdBWfLL_8AEjwmWP3PMoeYw9BRQjQ_A_HHNJHldjHX6T_qGkM58m26DHplgy_vkurKWXqDOeMNuFU3pwr2yopORwx3bz2ueVh0ejUb_44gV7VGOq9-UkFlXhaJZM', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE_RACE_VJ_MOSCO.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-18 00:18:38'),
(7647, 'BASTILLE DAY - VJ JUNIOR', '', 'video', 'https://beam-images.warnermediacdn.com/BEAM_LWM_DELIVERABLES/4643e83c-83cb-4413-9f0b-9c74a7640a6e/a510db3b-fd66-4a72-ab61-ca31b3307336?host=wbd-images.prod-vod.h264.io&partner=beamcom&w=500', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/BASTILLE_DAY_JR.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-15 08:33:41'),
(7645, 'THE PERFECTION - VJ Junior', '', 'video', 'https://static1.squarespace.com/static/61b7a2c705855c798750b051/61bbd27a2380cc5bda704517/61bbd2de2380cc5bda7070cf/1643304955933/?format=1500w', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE_PERFECTION_JR.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-15 08:22:36'),
(7648, 'THE INTRUDER - VJ JUNIOR', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/586e7ccd94c0faf80f2b640bcaafd50c15cc50b4bbcbad0d743c61395c32fbad.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE_INTRUDER_JR.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-15 00:39:52'),
(7646, 'UNDERCOVER PUNCH AND GUN - VJ ICEP', '', 'video', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdAPdXQ-k_cnBu5Myp5WaoQxAYf7PF3ZVPJg&s', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/UNDERCOVER_PUNCH_AND_GUN_ICEP.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-15 00:31:47'),
(7649, 'ECHO BOOMERS -  ICEP', '', 'video', 'https://media-cache.cinematerial.com/p/500x/qlttgi5d/echo-boomers-poster.jpg?v=1605368344', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/ECHO_BOOMERS_ICEP.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-15 00:26:10'),
(7582, 'Avatar: Fire and Ash - VJ Junior', '', 'video', 'https://thewestdaily.com/wp-content/uploads/2025/10/avatar-fire-ash.webp', '', '2026-04-10 19:34:12'),
(7576, 'PEAKY BLINDERS THE IMMORTAL MAN - VJ JUNIOR', '', 'video', 'https://ntvb.tmsimg.com/assets/p31942675_v_h10_aa.jpg?w=1280&h=720', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/PEAKY_BLINDERS_THE_IMMORTAL_MAN_JR.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-07 01:48:45'),
(7577, 'THE MORTUARY ASSISTANT - VJ JUNIOR', '', 'video', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1295920/capsule_616x353.jpg?t=1772040295', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE%20MORTUARY%20ASSISTANT%202026%20JR%201080p%20%28NO%27S%29.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-07 01:37:05'),
(7574, 'THE NEXT THREE DAYS - VJ Junior', '', 'video', 'https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/62/3a/84/623a8402-298b-692f-aec0-270f4ef3b29c/TheNextThreeDays_en-US_3840x2160_Cover-Art_412116209.lsr/1200x675.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20NEXT%20THREE%20DAYS.JR%20%5BS2M%20Ent%5D.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-04-05 01:56:47'),
(7572, 'AGENT ZERO BADH -  VJ.ULIO', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/1f409fce9c7ff4ea4e173aae7f5522d77c77ab21622f1056fdcf841f531c5845.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/AGENT_ZERO_BADH_ULIO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-04-04 10:27:31'),
(7526, 'PRETTY Lethal - VJ EMMY', '', 'video', 'https://www.tvtime.com/_next/image?url=https%3A%2F%2Fartworks.thetvdb.com%2Fbanners%2Fv4%2Fmovie%2F359643%2Fbackgrounds%2F69b3c20b688e5.jpg&w=3840&q=75', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/PRETTY_LETHAL_EMMY.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-04-03 09:16:58'),
(7519, 'SEND HELP -  VJ JUNIOR', '', 'video', 'https://thedisinsider.com/wp-content/uploads/2026/01/send-help.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/SEND_HELP_JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-04-01 12:15:31'),
(7514, 'CRIME 101 - VJ Emmy', '', 'video', 'https://i.ytimg.com/vi/h41g5V_eZYM/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDIFwGfBvpjasl-l9wHzlABkJRsJg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/CRIME_101_EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-03-29 23:45:59'),
(7502, 'PUSHED OFF THE A PALANE AND SURVIVED - VJ JUNIOR', '', 'genesis_free_movie', 'https://cloudfront-us-east-1.images.arcpublishing.com/advancelocal/APZJTGP5XVEUBCYPND3WZ4RL3I.png', '', '2026-03-29 21:04:50'),
(7094, 'THE HUNTED - VJ JOVAN', '', 'video', 'https://ntvb.tmsimg.com/assets/p31518_v_h8_ay.jpg?w=1280&h=720', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE%20HUNTED%20JOVAN.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-20 18:52:41'),
(7095, 'IN COLD LIGHT - VJ JOVAN', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/541fc2e1289670fc9dc1995d758cf7a4b8f9fff89fa8a61e7e877a2d14a6fbc4.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/IN%20COLD%20LIGHT%20JOVAN.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-20 18:49:01'),
(7339, 'NO WAY OUT', '<!-- wp:html /-->

<!-- wp:html -->
<!-- Full-width & full-height responsive video player -->
<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/NO%20WAY%20OUT%20MARK%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html --><!-- /wp:html -->', 'post', 'https://mytv256.com/upload/No%20Way%20Out.jpg', '', '2026-03-20 17:28:37'),
(7340, 'COLD STORAGE 2026 - VJ  EMMY', '<!-- wp:html /-->

<!-- wp:html -->
<!-- Full-width & full-height responsive video player -->
<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/COLD%20STORAGE%20EMMY.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>
<!-- /wp:html -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p class=""></p>
<!-- /wp:paragraph -->', 'post', 'https://i.ytimg.com/vi/cSeXZTKeHOI/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLB3JM4jdqWiQkrOf9GbFvb3AZt9dg', '', '2026-03-20 17:23:01'),
(7327, 'COLD STORAGE 2026 - VJ  EMMY', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/6fd201512f9b7977915900ff029abcbbc719e6f2865f7f5c78bd659f42cc53a8._SX1080_FMjpg_.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/COLD%20STORAGE%20EMMY.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-20 00:04:28'),
(7316, 'EMILY AND THE LOST MAGIC -  VJ C.B', '', 'video', 'https://canvas-lb.tubitv.com/opts/XIJUh7uIyX53cQ==/371db476-55ee-4644-9c45-ce4253081152/CPwDEJ0COgUxLjEuOQ==', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/EMILY%20AND%20THE%20LOST%20MAGIC%202026%20VJ%20C.B%201080p%20%28NO%27S%29.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-19 11:06:09'),
(7309, 'LEGEND OF CATCLAWS -  VJ C.B', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/dc55d7c58144210a75e8216884c66b72ee6d17f44c69b7769562c00d9235449e.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/LEGEND%20OF%20CATCLAWS%202026%20VJ%20C.B%201080p%20%28NO%27S%29.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-18 14:00:21'),
(7303, 'SURVIVOR - VJ C.B', '', 'video', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfN-ofMOrgNIEfykgrPN90BcUTAXEstoSolA&s', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/Survivor.mp4",>
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-17 20:36:52'),
(7149, 'Hunting Grounds -  VJ SOUL', '<!-- wp:html /-->

<!-- wp:html -->
<!-- Full-width & full-height responsive video player -->
<!-- Full-width & full-height responsive video player -->
<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Hunting-Grounds_1080p%20VJ%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>
<!-- /wp:html -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->', 'post', 'https://flixon.net/wp-content/uploads/2026/02/7b0a6c0e44b7b80402e3008b4621019ef6526bc113ff1cd59b3bee4299f4f588.jpg', '', '2026-03-10 10:49:25'),
(7147, 'WE LIVE IN TIME - VJ ULIO', '<!-- wp:html /-->

<!-- wp:html -->
<!-- Full-width & full-height responsive video player -->
<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/WE%20LIVE%20IN%20TIME%202024%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>
<!-- /wp:html -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->', 'post', 'https://flixon.net/wp-content/uploads/2026/01/0b4d9571-9dc8-4d93-bb75-757c57b52eaf-scaled.jpg', '', '2026-03-10 10:44:39'),
(7105, 'WAR MACHINE 2026 -  VJ JUNIOR', '', 'video', 'https://www.heavenofhorror.com/wp-content/uploads/2026/03/War-Machine-2026-Netflix-Movie-Review-1200x720.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/WAR%20MACHINE%20JR.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 20:19:48'),
(7100, 'ULITMATE SNIPER-  VJ JOVAN', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/abc9fb1816944e44793898de4db6a8280e3bd0737826baafb4c05ef1e10ab213.png', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/ULITMATE%20SNIPER%20JOVAN.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 20:17:17'),
(7102, 'THE HUNTED - VJ JOVAN', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/11685ab48657c90f1fdcc15a893369623c34544c131ae3436b95cb3a354668d7.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE%20HUNTED%20JOVAN.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 20:13:34'),
(7101, 'IN COLD LIGHT- VJ JOVAN', '', 'video', 'https://www.heavenofhorror.com/wp-content/uploads/2026/02/In-Cold-Light-thriller-review-1200x675.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/IN%20COLD%20LIGHT%20JOVAN.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 20:10:34'),
(7107, 'ROYAL MASTER - VJ EMMY', '', 'video', 'https://www.heavenofhorror.com/wp-content/uploads/2022/03/master-2022-review-prime-video-1200x900.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/ROYAL%20MASTER%20EMMY.2026%20%282%29.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 20:06:59'),
(7104, 'PUSHED OFF THE A PALANE AND SURVIVED - VJ JUNIOR', '', 'video', 'https://cloudfront-us-east-1.images.arcpublishing.com/advancelocal/APZJTGP5XVEUBCYPND3WZ4RL3I.png', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/PUSHED%20OFF%20THE%20A%20PALANE%20AND%20SURVIVED%20JR.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 20:02:24'),
(7103, 'WHISTLE  - VJ JUNIOR', '', 'video', 'https://whentostream.com/wp-content/uploads/2026/02/Whistle-Horizontal-10.jpeg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/WHISTLE_JR.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 20:00:09'),
(7111, 'THE GUN IN BETTY LOUS HANDBAG - VJ EMMY', '', 'video', 'https://i.ytimg.com/vi/cgiPAlhs4lI/hqdefault.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE%20GUN%20IN%20BETTY%20LOUS%20HANDBAG%20EMMY.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 19:57:18'),
(7109, 'THE PENDRAGON CYCLE RISE OF MERLIN 1 - VJ EMMY', '', 'video', 'https://images2.minutemediacdn.com/image/upload/c_crop,x_0,y_0,w_1920,h_1080/c_fill,w_1440,ar_1440:810,f_auto,q_auto,g_auto/images/ImageExchange/mmsport/365/01kfh95ez5sx8g91y7c7.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE%20PENDRAGON%20CYCLE%20RISE%20OF%20MERLIN%201%20EMMY.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 19:53:16'),
(7110, 'CHASE FOR AMBER - VJ EMMY', '', 'video', 'https://www.naijaprey.tv/wp-content/uploads/2026/03/aW5YR7paFxiIeUVG7EIuKh4H8ao-678x381.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/CHASE%20FOR%20AMBER%20EMMY.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 19:48:21'),
(7108, 'SECRET CULT - VJ EMMY', '', 'video', 'https://www.slashfilm.com/img/gallery/movies-about-cults-that-will-keep-you-up-at-night/kubrick-makes-cults-look-sexy-in-eyes-wide-shut-1625775087.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/SECRET%20CULT%20EMMY%202026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 19:38:31'),
(7112, 'THE PENDRAGON CYCLE RISE OF MERLIN 2 - VJ EMMY', '', 'video', 'https://resizing.flixster.com/5u8pqtgch5qtw1slWFDoSCHdPGc=/fit-in/705x460/v2/https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p31790124_b_h9_aa.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/THE%20PENDRAGON%20CYCLE%20RISE%20OF%20MERLIN%202%20EMMY.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-09 19:35:08'),
(3854, 'Jaadugar - VJ Emmy', '', 'video', 'https://www.sochfilmss.com/wp-content/uploads/2022/10/Jaadugar.jpg.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/81.1%20video_2025-10-19_05-55-29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-03-08 22:33:46'),
(6072, 'Space Dogs  - VJ Kevo', '', 'video', 'https://i.ytimg.com/vi/P39r6XDvkiA/maxresdefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/video_2025-12-14_10-40-27.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-03-08 22:03:56'),
(7091, 'ULITMATE SNIPER - VJ  JOVAN 2026', '', 'video', 'https://i.ytimg.com/vi/XwWwqfbrtYk/maxresdefault.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/ULITMATE%20SNIPER%20JOVAN.2026.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-08 21:55:31'),
(6070, 'The Son of Bigfoot - VJ Kevo', '', 'video', 'https://peanutgallery247.com/wp-content/uploads/2017/08/Bigfoot-junior-banner-wpcf_970x545.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/video_2025-12-14_10-40-31.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-03-06 21:45:00'),
(6068, 'Coming To America 2 - VJ Junior', '', 'video', 'https://s2.dmcdn.net/v/SlVx71W7A23ydBoRe/x1080', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/video_2025-12-16_10-10-31.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-03-06 21:30:25'),
(6708, 'THE CUT - VJ JOVAN', '', 'video', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSCZ-fv8HNoNvvn5RhPTWsaQp6eAtoD9ncLw&s', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20CUT%20JOVAN.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-03-05 18:00:57'),
(6885, 'The Descent - VJ SOUL', '', 'video', 'https://res.cloudinary.com/jerrick/image/upload/v1635380103/6179eb877691fc001de3f8ed.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/The-Descent_%20VJ%20SOUL.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-05 17:58:55'),
(6881, 'Flora Ulysses -  VJ SOUL', '', 'video', 'https://assets.murphysmultiverse.com/uploads/2021/02/flora-800x450.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/Flora-Ulysses_720p%20VJ%20SOUL.mp4">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-05 17:56:28'),
(6710, 'Bad Man - VJ SOUL', '', 'video', 'https://is1-ssl.mzstatic.com/image/thumb/Video221/v4/31/06/f6/3106f6c9-fc8f-a8e7-080c-f2211ed71d43/BadMan_iTunes_CoverArt_3840x2160.png/1200x675.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Bad-Man_1080p%20VJ%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-03-03 20:44:52'),
(6702, 'SLEEPWALKER - VJ EMMY', '', 'video', 'https://www.heavenofhorror.com/wp-content/uploads/2026/01/Sleepwalker-2026-movie-review.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/SLEEP_WALKER_EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-03-03 20:43:18'),
(6883, 'TEMPTED BY LOVE - VJ SOUL', '', 'video', 'https://substackcdn.com/image/fetch/$s_!K6MF!,f_auto,q_auto:best,fl_progressive:steep/https%3A%2F%2Fscenesincolor.substack.com%2Fapi%2Fv1%2Fpost_preview%2F147819262%2Ftwitter.jpg%3Fversion%3D4', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/TEMPTED%20BY%20LOVE%20-%20SOUL.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-03 20:39:34'),
(6884, 'Like Mike 2: Streetball  -  VJ SOUL', '', 'video', 'https://m.media-amazon.com/images/S/pv-target-images/f2f6cbb63ae1ad1a465c0538fe1d23ecc022e4516f243e7224bf018b376b2e23.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/LIKE%20MIKE%20.2%20.STREETBALL%20-%20SOUL.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-03 20:37:11'),
(6886, 'ROOM SIX - VJ JOVAN', '', 'video', 'https://i.ytimg.com/vi/MNpLVZbcrRA/mqdefault.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/ROOM%20SIX%20VJ%20JOVAN%202025.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-03 20:06:52'),
(6887, 'BATTLE OF THE WOLF - VJ MUSA', '', 'video', 'https://s3-ap-southeast-1.amazonaws.com/ams-astro/production/images/KUYPW.jpg', '<div style="position: relative; width: 100%; padding-top: 56.25%; overflow: hidden;">
  <video controls preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
    <source src="https://cdn.flixon.net/BATTLE%20OF%20THE%20WOLF%20VJ%20MUSA%202025.mkv">
    Your browser does not support the video tag.
  </video>
</div>', '2026-03-02 14:50:25'),
(6713, 'THE INTERNSHIP - VJ ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/maxresdefault_m1764869371.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The.Internship.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-15 09:56:50'),
(6712, 'Hunting Grounds -  VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/7b0a6c0e44b7b80402e3008b4621019ef6526bc113ff1cd59b3bee4299f4f588.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Hunting-Grounds_1080p%20VJ%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-15 09:51:38'),
(6706, 'SAVAGE HUNT -  VJ JOVAN', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/Savage-Hunt-2025-Horror-Movie-Poster-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/savagehuntvjovan.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-15 09:46:10'),
(6717, 'The Magnificent Butcher - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/3c53a0a2-a502-45a7-a55d-119e400721cf.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Magnificent%20Butcher%20-%20VJ%20JJINGO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-15 09:31:07'),
(6716, 'Flora Ulysses -  VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/flora-and-ulysses-header.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Flora-Ulysses_720p%20VJ%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div><!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Flora-Ulysses_720p%20VJ%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-15 09:27:05'),
(6725, 'LIKE MIKE 2  STREETBALL - VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/1200x675-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/LIKE%20MIKE%20.2%20.STREETBALL%20-%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-15 09:22:41'),
(6720, 'TEMPTED BY LOVE - VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/gfbter.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/TEMPTED%20BY%20LOVE%20-%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-15 09:13:43'),
(6722, 'The Descent - VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/images-original.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The-Descent_%20VJ%20SOUL.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-15 09:03:44'),
(6547, 'OUR FAULT - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/hq720-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/OUR%20FAULT%20JR.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:47:37'),
(6548, 'REGRETTING YOU - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/Regretting-You-Review-Header-FUTURE-OF-THE-FORCE.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/REGRETTING%20YOU%20%5B2025%5D%20JR%201080p%20@MR.NO%27s%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:42:55'),
(6545, 'ALONG FOR THE RIDE - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/thumb.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/ALONG%20FOR%20THE%20RIDE%202025%20VJ.ULIO%20%281%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:39:28'),
(6556, 'UPGRADED - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/upgraded-poster.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/UPGRADED%20HD%201080P%20VJ-ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:31:47'),
(6554, 'Wish You Were Here - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/p29045819_v_h10_ad.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Wish.You.Were.Here.2025.jr.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:26:09'),
(6550, 'THE LAKE HOUSE - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/7d098c57-f28d-4673-9470-1755478d3ceb-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20LAKE%20HOUSE%202025%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:22:35'),
(6569, 'HIMMATWALA 01 - VJ SHIELD', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/himmatwala.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/HIMMATWALA%2001.VJ%20SHIELD.2026%20.%5BKMB%5D.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:16:25'),
(6564, 'RUTH AND BOAZ - VJ Junior 2026', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/hq720-1-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RUTH%20AND%20BOAZ%20JR.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:10:20'),
(6562, 'THE ORPHANS-  EMMY 2026', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/922fb44ae64a7571251733bee4f3ece93fc061b5e335a722acded54e51e96b24-scaled.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20ORPHANS%20EMMY.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:06:26'),
(6560, 'BOOKS OF BLOOD -  VJ Junior  2026', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/1200x675.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/BOOKS%20OF%20BLOOD%20J.2026.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 22:00:35'),
(6559, 'GIRL HAUNTS BOY -VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/02/hq720-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/GIRL%20HAUNTS%20BOY%20-VJ%20JR.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-02-03 21:54:17'),
(6526, 'WE LIVE IN TIME - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/0b4d9571-9dc8-4d93-bb75-757c57b52eaf-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/WE%20LIVE%20IN%20TIME%202024%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-31 08:11:41'),
(6523, 'Rufus 2 - VJ Neil', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/4dfc8d841155f1e6e5df206208acc0dca8bb71a988801dbc301aee1e52b4c3bb.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Rufus-2_720p.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-31 08:02:33'),
(6520, 'RUFUS - VJ NEIL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/rufus-star-jace-norman-nickelodeon-original-tv-movie-nick-film-mannys-best-friend-greece-poster-with-logo.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RUFUS%20VJ%20NEIL%201080p%20@MR.NO%27s%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-31 07:55:58'),
(6516, 'Goosebumps 2 Haunted Halloween', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/gcga4d0-d16624e1bb49-640x360-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Goosebumps%202%20Haunted%20Halloween.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-31 07:47:58'),
(6428, 'NOT WITHOUT HOPE -  VJ EMMY - 2026', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/bb00x675.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/NOT%20WITHOUT%20HOPE%20EMMY.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-31 07:29:49'),
(6430, 'KUNG FU FIGHTER - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/bbhy0.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/KUNG%20FU%20FIGHTER%20-%20JINGO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-26 18:56:34'),
(6436, 'RED SONJA - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/RED-SONJA-REMAKE-MJ-BASSETT-MATILDA-LUTZ.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/REDSONJAJR.2026.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-26 18:34:04'),
(6433, 'THE LOSERS - JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/p7880285_v_h10_ab.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/KUNG%20FU%20FIGHTER%20-%20JINGO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-26 18:27:20'),
(6427, '12 HOURS IN OCTOBER - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/dcssges.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12HOURSINOCTOBERJR.2026.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-26 18:23:01'),
(6424, 'AMERICAN CYBORG STEEL WARRIOR - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/American-Cyborg-Steel-Warrior-1992.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/AMERICAN%20CYBORG%20STEEL%20WARRIOR%20-%20EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-26 17:10:16'),
(6422, 'ACT LIKE YOU LOVE ME - VJ JOVAN', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/vdefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/ACT%20LIKE%20YOU%20LOVE%20ME.JOVAN.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-26 17:09:31'),
(6421, 'CHASING SECRETS - VJ JUNIOR 2026', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/gsh00x675.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/CHASING%20SECRETS%20JR.2026.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-26 17:08:01'),
(6419, 'Heavenly Sword', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/d506038d7f5f7c0e0a075ef880ae99fe66f6d563e6994f27da0d1a900df79c6c.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Heavenly%20sword%2038.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-26 17:05:57'),
(6380, 'DON''T LOOK UP', '<!-- wp:html /-->

<!-- wp:html -->
<!-- Full-width & full-height responsive video player -->
<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/DON%27T%20LOOK%20UP%202026%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>
<!-- /wp:html -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->', 'post', 'https://flixon.net/wp-content/uploads/2026/01/dont-look-up-movie.webp', '', '2026-01-25 20:07:32'),
(6371, 'Predator Badlands', '<!-- wp:html /-->

<p><!-- Full-width & full-height responsive video player --></p>
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  ><source src="https://cdn.flixon.net/PREDATOR%20BLANDLANDS%20EMMY%202025.mkv">Your browser does not support the video tag.</video>
</div>

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->', 'post', 'https://flixon.net/wp-content/uploads/2025/12/Predator-Badlands-2025-movie-review.webp', '', '2026-01-25 14:42:20'),
(6116, 'RESIDENT EVIL 5 RETRIBUTION - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/resident-evil-retribution-poster.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RESIDENT%20EVIL%205%20RETRIBUTION%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-25 14:31:58'),
(6051, 'The Gods Must Be Crazy 2 - VJ Jingo) (1989)', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/1b7542b0479ec75ec952c895e1d726fdd968937e19ec10c5e126ee8440522f60-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Gods%20Must%20Be%20Crazy%202%20%28Jingo%29%20%281989%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-25 14:26:57'),
(6360, 'SARAH''S OIL  - VJ Junior', '<!-- wp:html /-->

<!-- wp:html -->
<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/SARAH%27S.OIL.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>
<!-- /wp:html -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->', 'post', 'https://flixon.net/wp-content/uploads/2026/01/SarahsOil-Banner-New-1200x600-InTheaters-NoButton-1680x0-c-default.webp', '', '2026-01-25 14:19:38'),
(6048, 'SARAH''S OIL - VJ.JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/SarahsOil-Banner-New-1200x600-InTheaters-NoButton-1680x0-c-default.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Sarahs.Oil.2025.720%20VJ%20JUNIOR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-25 14:12:36'),
(6045, 'SIDELINED .2  INTERCEPTED - VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/p31446627_v_h10_aa.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/SIDELINED%20.2%20.INTERCEPTED%20-%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-25 14:06:24'),
(6350, 'DANCES WITH WOLVES - VJ Mark', '<!-- wp:html /-->

<!-- wp:html -->
<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/DANCES%20WITH%20WOLVES%20MARK.mp4">

      Your browser does not support the video tag.
  </video>
</div>
<!-- /wp:html -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->', 'post', 'https://flixon.net/wp-content/uploads/2025/12/maxresdefault-2.jpg', '', '2026-01-25 14:02:31'),
(6027, 'DANCES WITH WOLVES - VJ MARK', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/maxresdefault-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/DANCES%20WITH%20WOLVES%20MARK.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-25 13:56:55'),
(6010, 'HUNTING JESSICA BROK - VJ JOVAN', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/Hunting-Jessica-Brok-2025.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/HUNTING_JESSICA_BROK_2025_JOVAN_1080p_@MR_NO%27s_ENT_0766009748%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-25 13:48:49'),
(6087, '1917 - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/maxresdefault-1-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1917%20full-hd%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-25 13:41:33'),
(6118, 'Resident Evil Welcome To Raccoon City - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/resident-evil-WTRC-characters.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Resident_Evil_Welcome_To_Raccoon_City_2021_juniorJB_HD_movies.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-25 13:30:00'),
(6017, 'First Love - VJ Isma K', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/30e4abc72628a2a4fc79ccbbdbe3fb30109a2d4e3c8e2b8459b091a04fb4f902.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/First%20Love%202022%20by%20Vj%20Isma%20K%20Romancy..mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 21:15:06'),
(6056, 'THE RITE - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/525a4d6b2d58ba7ae59a03a5e12a11c24b7d3a1a3eadb70380661aba5c6b1fba-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20RITE.JR.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 21:01:31'),
(6037, 'NO WAY OUT - VJ MARK', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/1391338_theroundup_977064.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/NO%20WAY%20OUT%20MARK%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 20:54:44'),
(6034, 'REMNANT - VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/maxresdefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/REMNANT%20-%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 06:35:26'),
(6285, 'LOOPER - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/looper_ver3.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/LOOPER.JR%20%282%29.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 06:22:04'),
(6046, 'The Blind Side - VJunior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/the-blind-side-2009.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Blind%20Side%20%5BAction%5DJunior%20@Bryn%20Media%20Movie.%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 05:48:09'),
(6043, 'Sidelined: The QB and Me  -  VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/hq720.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Sidelined-The-QB-and-Me_720p%20VJ%20SOUL.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 05:36:53'),
(6041, 'HUNTING SEASON - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/v_162088815_m_601_en_1013_569.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/HUNTING.SEASON.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 05:30:27'),
(6076, 'Fist OF Fury Soul', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/v_162088815_m_601_en_1013_569.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/fist%20of%20fury%20soul%20done.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 05:26:00'),
(6054, 'The Bourne Ultimatum - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/xdsi3q.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Bourne%20Ultimatum.Junior.@Bryn%20Media%20Movie.%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 05:17:21'),
(6052, 'The Gods Must Be Crazy 1  (1980) - VJ Jingo', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/GODS-ges.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Gods%20Must%20Be%20Crazy%201%20%28Jingo%29%20%281980%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-20 05:12:37'),
(6062, 'TROLL 2 - VJ EMMY 2025', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Troll-2-Netflix-Sequel-Review.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/TROLL.2.VJ.EMMY.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-19 21:10:39'),
(6075, 'Shazam! Fury of the Gods - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/674940c8a32ff3bcf4c53c1ac88f8d9e0d1b9561-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/shazam-fury-of-the-gods.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-19 21:03:45'),
(6083, 'HUSH - VJ JUNIOR 2025', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Hush.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/HUSH.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-19 20:57:34'),
(6078, 'SUPERMAN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/James-Gunns-Superman-2025-Movie-Review-Header-FUTURE-OF-THE-FORCE.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/SUPERMAN%20JR.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-02 21:37:52'),
(6080, 'THE BUS DRIVER - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/bus-driver-553961_SPA-73.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20BUS%20DRIVER%20VJ%20EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-02 21:34:25'),
(6084, 'KEEPER - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/images-8.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/KEEPER.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-02 21:28:43'),
(6112, 'RESIDENT EVIL 3 EXTINCTION - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/maxresdefault-8.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RESIDENT%20EVIL%203%20EXTINCTION%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-02 21:21:29'),
(6120, 'RESIDENT EVIL 4 AFTERLIFE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/unnamed-3.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RESIDENT%20EVIL%204%20AFTERLIFE%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-02 21:16:09'),
(6100, 'Polar - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/hq720-7.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Polar.1080p%20Vj%20Junior%5BJB%20HD%20movies%5D.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-02 21:10:23'),
(6088, 'THE ROOFMAN - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/p30422062_v_h9_ai.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20ROOFMAN%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-02 21:05:59'),
(6091, 'WAKE UP DEAD MAN  A KNIVES OUT - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/images-7.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/WAKE%20UP%20DEAD%20MAN.%20A%20KNIVES%20OUT%20MYSTERY%202026%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-01 08:13:54'),
(6093, 'FOUR KIDS AND IT - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/maxresdefault-7.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/FOUR%20KIDS%20AND%20IT.JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-01 08:08:48'),
(6094, 'Ballad of a Small Player', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/ballad-of-a-small-player-header.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Ballad-of-a-Small-Player_1080p.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-01 08:03:57'),
(6106, 'DON''T LOOK UP - VJ.ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2026/01/dont-look-up-movie.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/DON%27T%20LOOK%20UP%202026%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-01 07:55:48'),
(6114, 'COLD HARVEST - JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/coldharvest.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/COLD%20HARVEST%20-%20JINGO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-01 07:50:52'),
(6110, 'RESIDENT EVIL 2 APOCALYPSE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/hhh.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RESIDENT%20EVIL%202%20APOCALYPSE%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-01 07:45:35'),
(6108, 'RESIDENT EVIL 1 - JV JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Resident-Evil-Header.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RESIDENT%20EVIL%201%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2026-01-01 07:40:57'),
(5993, 'Now You See Me Now You Don''t - VJ NELLY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/AAAAQbjxhmW3KTDT9ZthXfvEfPc_n9WUSUfHIoIK2Z5IV_X7NzvnW31c04Ne0_CoRkVJ6L91CRCZXtwodcCZn9YPMPmO9s8AE3ASVqIxX3yhk0tFu1Q6XeXZHT-4k08463IQhMXPQHor0oSmbXfKfHgeuyB18xk.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Now-You-See-Me-Now-You-Dont_VJ%20NELLY.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-27 19:44:39'),
(5989, 'Spiderman No Way Home -  VJ junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/maxresdefault-6.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Spiderman%205%20no%20way%20home%20Vj%20junior.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-27 19:36:53'),
(5896, 'TUCKER AND DALE VS EVIL  -  VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/hq720-6.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/TUCKER%20AND%20DALE%20VS%20EVIL%20__%20VJ%20EMMY%20%23Horror%20%282%29.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 16:46:32'),
(5900, 'M3GAN 2.0 - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/M3GAN2.0_keyart_mobile_3840x2160.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/M3GAN%202.0%20JR%202025%20%282%29%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 14:25:23'),
(5902, 'PREDATOR BLANDLANDS -  EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Predator-Badlands-2025-movie-review.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/PREDATOR%20BLANDLANDS%20EMMY%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 14:17:08'),
(5904, 'BODY GUARD - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/hq720-5.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/BODYGUARD.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 14:07:28'),
(5906, '211 - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/CPwDEJ0COgUxLjEuOA.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/211.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 14:02:45'),
(5908, 'THE SANDMAN - EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/images-6.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20SANDMAN%20EMMY%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 13:58:47'),
(5910, 'MUZZLE CITY OF WOLVES - EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/images-5.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/MUZZLE.CITY.OF.WOLVES.EMMY.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 13:54:43'),
(5912, 'RICOCHET -  VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/fd1cf9deba6923cb7073e45663a0c4b9e325230f-scaled.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RICOCHET.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 13:48:44'),
(5914, 'FEAR OR SUM OF ALL FEARS - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/SOAF_US_2002_SA_16x9_1920x1080_NB_3077187_1920x1080.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/FEAR%20OR%20SUM.OF.ALL.FEARS.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-25 13:44:09'),
(5241, 'UNTRACEABLE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/983c10d0-39da-4e59-99c9-6a51c45b5750.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.3%20%20UNTRACEABLE%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-23 02:46:59'),
(4962, 'PLAY DIRTY - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/play-dirty-poster.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20PLAY%20DIRTY%20%5B2025%5D%20JR%201080p%20%40MR.NO''s%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-23 02:42:49'),
(4686, 'JAGGED EDGE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/p8737_v_h10_ah.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20JAGGED%20EDGE%20JR%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-23 02:34:37'),
(5573, 'Decibel - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Decibel.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20Decibel.2022.720%20Vj%20EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-23 02:26:08'),
(5583, 'WANTED - VJ MUSA', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/images-4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20WANTED%20%5B2025%5D%20VJ%20MUSA%201080p%20@MR.NO%27s%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-23 02:05:15'),
(5577, 'DEEP SEA PYTHON - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/maxresdefault-4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20DEEP%20SEA%20PYTHON%20EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-23 02:00:38'),
(5575, 'BLACK PHONE 2  - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-3-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20BLACK.PHONE.2.VJ.EMMY.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-23 01:54:13'),
(5585, 'FIGHTER -  1 ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/x1080-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20FIGHTER%201%20ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-21 06:59:18'),
(5589, 'FIGHTER 2  - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/x1080-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20FIGHTER%202%20ICE%20P.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-21 06:52:51'),
(5581, 'RED LAND - VJ MUSA', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/MV5BMWYwMjFkMTEtYzYyYS00MDI0LWExODYtYWNkNWYyZmEyOThiXkEyXkFqcGc@._V1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20RED%20LAND%20%5B2025%5D%20VJ%20MUSA%201080p%20@MR.NO%27s%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-21 06:50:10'),
(5587, 'VENGEANCE OF AN ASSASSIN - VJ ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/c1bae37e673fd2bd2e59703b359b75d7509ba40fd87a3d191fce1d755820a9dc.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20VENGEANCE%20OF%20AN%20ASSASSIN_VJ.ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:51:45'),
(5595, 'Off The Menu - VJ Mun', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/d1fdf3d7cf00d1abe6770fc515a37bf86650cf38bf72b0d18ade9d21796a749a.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20Off%20The%20Menu%20by%20Vj%20Mun.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:48:14'),
(5601, 'THE FLASH', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/MV5BMTYwNDgzYmMtMjhkYi00YzlmLTk0MTUtMGVkZjk0Mjk0OWY3XkEyXkFqcGdeQWFybm8@._V1-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20THE%20FLASH%202023%20@NanaEnglishMovieHub.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:43:09'),
(5597, 'MY TEACHERS WIFE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/AAAABWTeo621SjSF8L57KWPMs4G6b-quUkkGYrq0UmD4BzUVfIpYUkJcK2OaQPLh-M-VR5up99HqQU4lTFrHoePG5hYplIduu1EF7hqV.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20MY%20TEACHERS%20WIFE%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:42:24'),
(5603, 'The Incredible Burt Wonderstone  - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/the-incredible-burt-wonderstone_09.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20The%20Incredible%20Burt%20Wonderstone%20__%20VJ%20JUNIOR%20%23Comedy%20%23Drama.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:30:49'),
(5609, 'DEATH SHE WROTE - VJ  EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/https___vms-tv-images-prod.s3-ap-southeast-2.amazonaws.com_2024_12_657404_standardcard.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20DEATH%20SHE%20WROTE.EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:26:32'),
(5607, 'RATTLE SNAKE - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p20255229_v_h9_ad.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20RATTLE%20SNAKE%20_ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:24:02'),
(5611, 'GODZILLA X KONG, THE NEW EMPIRE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAAQXs9BsFs7IX3BiX6VVXvUbGcUWlL_tCzzrnCuhbOYul89FIb4xbAn8f42YfkRsGbYF6I-r9FhL3sQoFnmtXa8MCDtZv-XjyX7jX5WHw7YBRgazZ-qQAPjgv14rRh8ghRkdP50kH8t5UuafjAhy4v376KzKM.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20%20GODZILLA%20X%20KONG.%20THE%20NEW%20EMPIRE%20JR%202024.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:21:02'),
(5615, 'TWO MEN IN TOWN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/TMIT-CMG-website-billboard-HVevergreen.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20TWO%20MEN%20IN%20TOWN%20JR.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-17 14:16:44'),
(5613, 'ARMY OF ONE - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-2-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20ARMY%20OF%20ONE.EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-15 14:51:42'),
(5617, 'TWO MEN IN TOWN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/TMIT-CMG-website-billboard-HVevergreen.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20TWO%20MEN%20IN%20TOWN%20JR.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-15 14:49:22'),
(5635, 'HUNT THE WICKED -  ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/hq720-3.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20HUNT%20THE%20WICKED%20ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-15 11:07:14'),
(5637, 'Overdrive - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Overdrive-Movie-Poster-2-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Copy%20of%20OVERDRIVE%20JR%20%282%29.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-15 11:03:04'),
(5641, 'Accident - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/AAAAQe3R0hYTlC0VWdaZy2ZHWTHKdhnpX-GjFY-HSg4nFNPKRArD46HP7ttsXZvGbVi13JYNI-XUtZJOTbMRYiJU2vz-wEV4JSfo3IxgYw9U__9XoCbTIkB4PFeG8IbZxw4D1dorNWQdNaeAF_hKeg.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20Accident%20___JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-15 09:37:56'),
(5643, 'Irish Wish - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/sddefault-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20Irish.Wish.2024.1080p%20___JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-15 09:26:44'),
(5646, 'OPPENHEIMER SCIFI - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Oppenheimer.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/%21%20OPPENHEIMER%20SCIFI%20VJ%27ULIO%20part%201%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-15 09:20:15'),
(5644, 'MY FATHER MURDER IN GREECE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/70a655a63d3998f47f6a3aa5da8aeba897a84bfd826cd7f163a58939612a0fc3-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20MY%20FATHER%20MURDER%20IN%20GREECE%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-15 09:13:24'),
(5650, 'OVERDRIVE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Overdrive-Movie-Poster-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Copy%20of%20OVERDRIVE%20JR%20%282%29.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-10 07:38:24'),
(5648, 'HUNT THE WICKED  - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/maxresdefault-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/HUNT%20THE%20WICKED%20ICE%20P%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-10 07:34:29'),
(5652, 'Damsel - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/Damsel-2024-netflix-review-1200x628-1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Damsel.2024.1080p.%20JR%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-10 07:23:44'),
(5654, 'Badland Hunters - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/AAAABa5FqV-P1vLR8S3tY7f64j0A48j_iEuRzEM7jKErhwJNdJKELodkXbC1OLzfG-oUfRTTu0pP2LhoyJwI_tvrYdJg85IGYg8wIM-j.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Badland.Hunters.2024.1080p%20jr%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-10 07:19:45'),
(5656, 'FLOAT - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/1cc50e14b9b65ee3d371b69b0e987c0e3f96dc509ab342a7347d426db2acb514-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Watch%20Cash%20Out%20%282024%29%20by%20Vj%20Emmy%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-10 07:07:10'),
(5664, 'MILE 22 - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/2271206-Banner-L2-d1fdafefc5a8796c6e23879ce489610c.jpeg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/MILE%2022.ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-10 07:02:57'),
(5670, 'The Meg -  Ice P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/maxresdefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Meg%201%20%20vj%20ice.p.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-10 06:58:05'),
(5631, 'XIII CONSPIRACY - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/hq720-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20XIII%20CONSPIRACY_ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 04:42:25'),
(5633, 'ART OF LOVE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Art_of_Love.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20ART%20OF%20LOVE%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 04:38:47'),
(5639, 'ARCADIAN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/arcadian.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20ARCADIAN%20JR%202024.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 03:54:58'),
(5672, 'The Killer - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p22500552_v_h9_ah.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Killer%20by%20Vj%20Junior%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 03:52:11'),
(5658, 'One More Short - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/6994.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/One%20More%20Short%20EMMY%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 02:32:33'),
(5660, 'SIMULANT - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/hqdefault-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/SIMULANT%20JR%20%282%29.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 02:23:46'),
(5662, 'THE DARKEST MIND  - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/hqdefault-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20DARKEST%20MIND%20%20-%20JR%20%282%29.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 02:20:38'),
(5667, 'Love at First Hiccup - VJ Ulio', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/love-at-first-hiccup.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Love%20at%20First%20Hiccup%20by%20Vj%20Ulio_2%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 02:12:20'),
(5668, 'My Fault - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-1-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/My%20Fault%20by%20Vj%20Junior%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-04 02:09:09'),
(5674, 'The Bricklayer -  VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/images-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Bricklayer%20by%20Vj%20Junior%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-03 21:53:41'),
(5676, 'The Incredible Burt Wonderstone - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/772138ca-05c8-455d-9229-382fe5250acb.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Incredible%20Burt%20Wonderstone%20__%20VJ%20JUNIOR%20%23Comedy%20%23Drama%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-03 21:50:13'),
(5678, 'RADIUS  - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/sddefault-5.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/RADIUS%20EMMY%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-03 21:45:12'),
(5681, 'KILL COMMAND - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/e762ab22f162984e2a08f7e0f2f8b538aeb9a63f48afd2a968c2fc86eebd19a4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/KILL%20COMMAND%20ICE%20P%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-03 21:42:21'),
(5682, 'The Client List - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/client-list-show.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The.Client.List.%5BLove%20Story%5DJunior%20@Bryn%20Media%20Movie%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-03 21:34:48'),
(5692, 'Cash Out - Vj Emmy', '', 'video', 'https://flixon.net/wp-content/uploads/2025/12/c53b7c0b4ba10099c8f9a63a1832d2cd09859c4806aa590764d8402620c5e021.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Watch%20Cash%20Out%20%282024%29%20by%20Vj%20Emmy%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-03 21:27:47'),
(5696, 'THE OTHER ZOEY - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/a80ba8610f622daab61a820c73ac829d49c433d709c41906f67b8413d6ee0636-1200x675-1.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20OTHER%20ZOEY%20JR%20HD%202023%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-03 21:09:00'),
(5700, 'Damaged - VJ Emmy', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/9f9c812d5ad72e8a4f1914546351479db1130156713dae82f543c2c0c371505c-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Watch%20Damaged%20%282024%29%20by%20VJ%20Emmy%20%282%29.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-12-03 21:03:44'),
(5698, 'TUCKER AND DALE VS EVIL -  VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/8e4fc010-599e-46fb-8a68-14b4ffdf1a42.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/TUCKER%20AND%20DALE%20VS%20EVIL%20__%20VJ%20EMMY%20%23Horror%20%282%29.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-30 05:59:17'),
(5579, 'TWIN DRAGONS - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/w4m_250105_0211_269aafec_twin_dragons_b.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20%20TWIN%20DRAGONS_ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-29 12:55:54'),
(5591, 'RATTLE SNAKE - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/aaaabulzxmnz4dwgosn3q7yoo6vezwa0xe1oob8nxzfuzfalgqegrh14b6_bf9xbq53kz9raz3c1von_qx2wl_xmkutqqigv9ocb813jbxzsvid-qwedb-os66k9vlwjxa-3.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/10%20RATTLE%20SNAKE%20_ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-29 12:45:01'),
(5002, 'LOVE HURTS - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/love-hurts.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20LOVE%20HURTS%20VJ%20EMMY%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-16 00:52:14'),
(5284, 'Twisters - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/twisters.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20Twisters.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-16 00:36:06'),
(5286, 'The Pirates - The Last Royal Treasure -  VJ SOUL', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p21711270_v_h10_ag.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20The%20Pirates-%20The%20Last%20Royal%20Treasure%20(2022)%20VJ%20SOUL.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-16 00:31:55'),
(5288, 'The Gray Man -  VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p21562309_v_h8_aa.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20The%20Gray%20Man%20by%20Vj%20Junior.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-16 00:25:48'),
(5290, 'THE OTHER BOLEYN GIRL - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/TOBG_SAlone_16_9_1920x1080_NB_3077127_1920x1080.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20THE%20OTHER%20BOLEYN%20GIRL.JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 19:55:32'),
(5292, 'THE CERTAIN JUSTICE - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/images.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20THE%20CERTAIN%20JUSTICE%20-%20JINGO%20(2).mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 19:47:46'),
(5294, 'Rebel Moon 2 -  VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/gxkm5h8nFCeskHB4pHLnNU-1200-80.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20Rebel%20Moon%202%20Jr.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 19:41:15'),
(5320, 'THE INNOCENCE - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/The-Innocents-2021-Review.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20%20THE%20INNOCENCE%202025%20VJ.ULIO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 19:35:05'),
(5300, 'Mega Crocodile - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Mega-Crocodile-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20Mega%20Crocodile.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 19:34:05'),
(5296, 'Police Academy 1 - VJ Jingo', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAABQlXp8hBUcRKSFZxqU4xoWsAB6nvjhjwXIk7LsV_lnVKhxDyKEOaBVH7tCT_EcoYDVc-ezS02edPOGhY-3FQUBoOwg9xjfoNQUhD.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20Police.Academy.1.%20.Jingo.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 19:31:01'),
(5302, 'Mea Culpa  - Vj Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-22.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20Mea%20Culpa%20by%20Vj%20Junior.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 19:05:27'),
(5304, 'Liger - VJ Emmy', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Liger-Movie-Review.png', 'https://cdn.flixon.net/11.5%20Liger%20by%20Vj%20Emmy.mp4', '2025-11-15 18:59:23'),
(5306, 'Land of Bad - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hqdefault-1-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20Land%20of%20Bad%20by%20Vj%20Junior%20(2).mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:55:16'),
(5308, 'KICK-ASS 1  - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/dfeeafb61e732073074be0689718a58b.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20KICK-ASS%201%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:49:49'),
(5310, 'Eye For An Eye 2  - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/sddefault-4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20Eye%20For%20An%20Eye%202.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:45:20'),
(5312, 'EAGLE EYE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hqdefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20EAGLE%20EYE%20JR%20HD.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:42:10'),
(5314, 'BOOGEYMAN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/d95688390d43b227aa53c1297229b327f4960b6096c6d0c3f8a7e388f9555576-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20BOOGEYMAN%20%7BVJ%20JUNIOR%7D%20(2).MP4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:36:09'),
(5316, 'BAD MOON - VJ  NELLY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/CPwDEJ0COgUxLjEuOA-1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20BAD%20MOON%20NELLY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:29:22'),
(5318, 'THE OLD WOMAN WITH THE KNIFE - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p30150417_k_h8_ac.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20%20THE%20OLD%20WOMAN%20WITH%20THE%20KNIFE%202025%20VJ.ULIO.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:24:35'),
(5322, 'THE CERTAIN JUSTICE - VJJINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/images.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20%20THE%20CERTAIN%20JUSTICE%20-%20JINGO%20(2).mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:17:13'),
(5324, 'SAFE HOUSE  -VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p8786328_v_h9_ad.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20%20SAFE.HOUSE.VJ.EMMY.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:12:42'),
(5326, 'PRISONER OF LOVE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p23421318_v_h9_aa.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20%20PRISONER%20OF%20LOVE%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:08:18'),
(5328, 'ICE FALL - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-20.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20%20ICE%20FALL%20JR.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 18:03:11'),
(5330, 'GOOD FORTUNE  -  VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/share.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20%20GOOD.FORTUNE.VJ.JUNIOR.2025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 17:58:18'),
(5332, 'BREAKING AND RE-ENTERING - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAABb5xnjYNEJQlCNa86q6AQeuBJdWujc_IwITupW3i4HyJO2YYMDf8v6OvA17uYqEOsevQydo3TrNXL8qyXCeCr4QvfqWq1SCDGIYXGl8Dkmq0pjKIQGQTP0GsLBnQ3g5svEddb9knw3xHZQL7Ih0aSwtzX3ICfBRy_N8qwxXUsluPBnlbqYScsxuAybfiJ0a0Qk.jpg', '<!-- Responsive MP4 Player - 100% width, 16:9 aspect ratio -->
<div style="position: relative; width: 100%; margin: 0 auto;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
    <iframe src="https://www.livereacting.com/tools/mp4-player-embed?url=https%3A%2F%2Fcdn.flixon.net%2F11.5%2520%2520BREAKING%2520AND%2520RE-ENTERING%25202025%2520VJ.ULIO.mkv" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            frameborder="0" allowfullscreen>
    </iframe>
  </div>
</div>', '2025-11-15 17:52:35'),
(5334, 'Army Of Thieves  - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Army-Of-Thieves-VJ-JUNIOR.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20%20Army%20Of%20Thieves%20%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 17:16:03'),
(5298, 'PRIMITIVE WAR - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/e9847c8a-cfad-495e-b03d-52066fbd9a03.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.5%20PRIMITIVE%20WAR%20JR.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 16:10:24'),
(5275, 'TRUE BELIEVER - VJ MARK', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/1200x675CA.TVA23C01.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.3%20%20%20TRUE%20BELIEVER%20MARK.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 13:02:01'),
(5268, 'LOST BATTALION - VJ MARK', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p28621_v_h10_ac.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.3%20%20LOST%20BATTALION%20MARK.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 12:32:38'),
(4964, 'Officer On Duty - VJ JINGO', '', 'video', 'https://news24online.com/wp-content/uploads/2025/02/officer-on-duty-ott.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20Officer%20on%20duty%20vj%20jingo.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-15 12:25:44'),
(5237, 'I AM LEGEND - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p170977_v_h10_aa.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11.3%20I%20AM%20LEGEND%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-11 19:29:05'),
(5233, 'The Owners - VJ Jingo', '<!-- wp:html /-->

<!-- wp:html -->
<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Owners%20-%20VJ%20Jingo.mp4">
      Your browser does not support the video tag.
  </video>
</div>
<!-- /wp:html -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->', 'post', 'https://flixon.net/wp-content/uploads/2025/11/hq720-6-1.jpg', '', '2025-11-11 16:05:53'),
(5206, 'SEARCH AND DESTROY - ICE P', '<!-- wp:embed {"url":"https://dai.ly/x8rkh7m","type":"video","providerNameSlug":"dailymotion","responsive":true,"className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} -->
<figure class="wp-embed-aspect-16-9 wp-has-aspect-ratio wp-block-embed is-type-video is-provider-dailymotion wp-block-embed-dailymotion"><div class="wp-block-embed__wrapper">
https://dai.ly/x8rkh7m
</div></figure>
<!-- /wp:embed -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p class=""></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p class=""></p>
<!-- /wp:paragraph -->', 'post', 'https://flixon.net/wp-content/uploads/2025/11/Search-And-Destroy.jpg', '', '2025-11-11 02:09:16'),
(5161, 'THE ELEVATOR 1 :: VJ NELSON #Thriller', '<!-- wp:embed {"url":"https://www.dailymotion.com/video/k3ErRGpeCUlP8bDU6ls","type":"video","providerNameSlug":"dailymotion","responsive":true,"className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} -->
<figure class="wp-embed-aspect-16-9 wp-has-aspect-ratio wp-block-embed is-type-video is-provider-dailymotion wp-block-embed-dailymotion"><div class="wp-block-embed__wrapper">
https://www.dailymotion.com/video/k3ErRGpeCUlP8bDU6ls
</div></figure>
<!-- /wp:embed -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p class=""></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p class=""></p>
<!-- /wp:paragraph -->', 'post', 'https://flixon.net/wp-content/uploads/2025/11/d53dd355ff3d10d2bec1e0969232b1cfd69383a5d711829eef3906bfa0d74d68.jpg', '', '2025-11-10 23:39:29'),
(5131, 'DESPERATE MEASURES VJ JUNIOR 2025', '<!-- wp:embed {"url":"https://www.dailymotion.com/video/k7xpWA33VKgS46DUfDa","type":"video","providerNameSlug":"dailymotion","responsive":true,"className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} -->
<figure class="wp-embed-aspect-16-9 wp-has-aspect-ratio wp-block-embed is-type-video is-provider-dailymotion wp-block-embed-dailymotion"><div class="wp-block-embed__wrapper">
https://www.dailymotion.com/video/k7xpWA33VKgS46DUfDa
</div></figure>
<!-- /wp:embed -->

<!-- wp:html -->
<style>   

..flixon-subscribe-banner {
  background: linear-gradient(135deg, #ff0000, #ff4747);
  color: #fff;
  padding: 30px 20px;
  border-radius: 15px;
  text-align: center;
  margin: 40px auto;
  max-width: 600px;
  box-shadow: 0 5px 20px rgba(255,0,0,0.5);
  animation: popIn 1s ease;
  position: relative;
}

.flixon-subscribe-banner h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  animation: bounce 6s infinite;
}

.flixon-subscribe-banner p {
  font-size: 1rem;
  margin-bottom: 15px;
}

.flixon-subscribe-banner .btn-subscribe {
  display: inline-block;
  background: #fff;
  color: #ff0000;
  font-weight: bold;
  padding: 12px 25px;
  border-radius: 30px;
  text-decoration: none;
  transition: transform 0.3s, box-shadow 0.3s;
}

.flixon-subscribe-banner .btn-subscribe:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255,0,0,0.4);
}

/* Animations */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
   </style>


<section class="flixon-subscribe-banner">
  <div class="subscribe-content">

    <p>Enjoy the best quality, more movies, and a superior video player experience.</p>
<h2>Upgrade to Premium</h2>
    <a href="https://flixon.net/choose-subscription1/" class="btn-subscribe">Subscribe to Premium</a>
  </div>
</section>

<script>
document.addEventListener("DOMContentLoaded", function() {
  // Replace any visible text "Blog" with "FreeMovies"
  document.querySelectorAll("body *").forEach(el => {
    if(el.children.length === 0 && el.textContent.includes("Blog")){
      el.textContent = el.textContent.replace(/Blog/g, "FreeMovies");
    }
  });
});
</script>
<!-- /wp:html -->

<!-- wp:paragraph -->
<p class=""></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p class=""></p>
<!-- /wp:paragraph -->', 'post', 'https://flixon.net/wp-content/uploads/2025/11/sddefault-3.jpg', '', '2025-11-10 22:05:14'),
(4947, 'STOLEN GIRL -VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-19.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20STOLEN%20GIRL%20EMMY%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-10 09:37:12'),
(4921, 'THE GORGE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-12.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20GORGE%20JR%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-10 09:34:09'),
(4950, 'SPL- Kill Zone - VJ Jingo', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/gdnWKwfZwGInFhNXMxX5Nb45x3g.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20SPL-%20Kill%20Zone%20by%20Vj%20Jingo.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-10 09:28:10'),
(4966, 'FIGHT OR FLIGHT - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/0_0_3538361_98_1920x1080_123673_1920x1080.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20FIGHT%20OR%20FLIGHT%20JR%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-10 09:26:17'),
(4952, 'SILENT ZONE - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/1ed12261d002fe8a16dabed1f0d086a4c956f9292e276be09a4acef4ae003f46.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20SILENT%20ZONE%20ICE%20P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-10 09:21:13'),
(4968, 'Chhota Bheem and the Curse of Damyaan part 2 - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/chhota-bheem-and-the-curse-of-damyaan-et00398911-1716291372-1.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20Chhota%20Bheem%20and%20the%20Curse%20of%20Damyaan%20part%202.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-10 09:15:45'),
(4960, 'PLAY DIRTY - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-11.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20PLAY%20DIRTY%20%5B2025%5D%20JR%201080p%20%40MR.NO''s%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 12:04:57'),
(4970, 'Chhota Bheem and the Curse of Damyaan part 1 - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/chhota-bheem-and-the-curse-of-damyaan-et00398911-1716291372.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20Chhota%20Bheem%20and%20the%20Curse%20of%20Damyaan%20part%201.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 12:00:37'),
(4972, 'BANG BANG 2 - VJ ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-10.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20BANG%20BANG%202%20__%20VJ%20ICE%20P%20%23Action%20%23Romance.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 11:56:11'),
(4984, 'The Raid Redemption - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/the-raid-468138.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20The%20Raid%20Redemption%20%5BAction%5DJunior%20@Bryn%20Media%20Movie..mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 11:43:21'),
(4996, 'The Raid redemption Pt 2 - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/raid.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20Raid_redemption_Pt_2_Jr_Act_SMZ_VIDEO_LIBRARY_0703_640640_mp4.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 11:39:29'),
(4974, 'ALEX CROSS - ICE P .mp4', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/afa1da59e9a348aab2a7243a1b211fc93fc91b002cf57f342ea3839d7c9db91d.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20ALEX%20CROSS%20___ICE%20P%20(2).mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 11:34:43'),
(4976, 'A MOTHERS REVENGE - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/2e3ab2b436f5ec3d97122a54608f130a5b98ccb21504168a90a683d6b6c80302-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20A%20MOTHERS%20REVENGE%20VJ%20EMMY.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 11:30:06'),
(4978, 'A GENTLEMAN - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/4bcb516ba49a160cafb38bb2ba67c877cea4ab6d406928cac3e06dcca873a971.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20A%20GENTLEMAN%20%5B2017%5D%20EMMY%201080p%20MR.NO''S%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 11:25:34'),
(4994, 'STRANGE DARLING - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-17.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20STRANGE%20DARLING%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 11:17:44'),
(4990, 'THE LOST BUS - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Apple_TV_The_Lost_Bus_key_art_graphic_header_4_1_show_home.jpg.og_.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20THE%20LOST%20BUS%20%5B2025%5D%20JR%201080p%20@MR.NO%27s%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-09 11:10:39'),
(4998, 'ONE OF THEM DAYS -  VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hqdefault-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20ONE%20OF%20THEM%20DAYS%202025%20VJ.ULIO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:46:47'),
(4988, 'THE SOUL FOOD -  VJ.ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AFI21_SOULFOOD_Social-Assets_B_v12.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20THE%20SOUL%20FOOD%201080HD%20VJ.ULIO%20(1).mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:43:11'),
(5004, 'CONTROL - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-4-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20CONTROL%20VJ%20EMMY%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:38:31'),
(5008, 'ANYONE BUT YOU -  VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/a5be487e-7b9c-4bcc-b59f-358e3c25de4a.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20ANYONE%20BUT%20YOU%202024%201080p%20VJ-ULIO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:34:23'),
(5006, 'BLACK CADILLAC - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Black-Cadillac-Pic-3.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20BLACK%20CADILLAC%20-%20EMMY.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:31:57'),
(5010, 'THE HATE YOU GIVE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/The-Hate-U-Give.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20%20THE%20HATE%20YOU%20GIVE%20JR%5B%20JB%20HD%20movies%5D.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:29:06'),
(5012, 'LOVE HURTS - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/a6c78ec7-c5a5-4fd6-85c0-dcaf63f0f85a_1500x750.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20%20LOVE%20HURTS%20JR.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:26:28'),
(5014, 'KINDA PREGNANT -  VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/brianne-howey-and-amy-schumer-sitting-among-pregnant-women-at-a-support-group-in-kinda-pregnant.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20%20KINDA%20PREGNANT%20VJ%20EMMY%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:22:31'),
(5018, 'IT  WAITS - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-3-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20%20%20IT%2520WAITS%2520VJ%2520JINGO%25202025.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:17:49'),
(5020, 'ACCURSED -  VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/9da352ec312f5bcf30a8d76e9a4bd924178028eaf0dfd2fe32e7ad9d9a744689.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/ACCURSED%20VJ%20EMMY%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 13:11:29'),
(4939, 'THE ORDER - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-3.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20ORDER%20JR%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 00:24:11'),
(4919, 'FIST OF LEGEND 3 - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-1-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/FIST%20OF%20LEGEND%203%20JR%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-08 00:18:54'),
(4849, 'NOTHING TO LOSE - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/compose.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.55%20NOTHING%20TO%20LOSE%20-%20JINGO.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 14:16:12'),
(4851, 'A Day To Die - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/8259f92f57f005389e309222e78e2b2e1fd6063a930d2695ec4ef595b01ea8c5.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.55%20A.Day.To.Die.2022.720p.WEBRip.x264.AAC-%5BYTS.MX%5D.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 14:08:34'),
(4853, 'THE FORGE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/bg-home.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.55%20%20THE%20FORGE%20JR%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 13:59:43'),
(4855, 'PREY - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/20220820_CUP505.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.55%20%20%20PREY%20JR%202022%201080P.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 13:55:16'),
(4857, 'THE PROSECUTOR -  VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-1-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20THE%20PROSECUTOR%20VJ%20JINGO%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 13:37:03'),
(4859, 'HEAD OF STATE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20HEAD%20OF%20STATE%20JR.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 13:09:08'),
(4866, 'Final Destination 4 - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-2-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20Final%20Destination%204%20-%20VJ%20EMMY%20%23horror.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 12:12:50'),
(4869, 'FLIGHT RISK - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Flight-Risk-2025-Review-Mel-Gibson.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20FLIGHT%20RISK%20VJ%20EMMY%202025.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 12:09:55'),
(4872, 'Visions  -  VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/cbe2c71f76aa6c95ac367e5d07c68344973e1ffd3ceba997edd751750c841cc2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20%20Visions%20by%20Vj%20Junior.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 12:05:21'),
(4874, 'THUNDERBOLTS - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/thunderbolts-marvel-studios.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20%20THUNDERBOLTS%20%5B2025%5D%20JR%201080p%20%40MR.NO''S%20ENT%200766009748.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 12:02:16'),
(4876, 'EXTRATERRESTRIAL - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Extraterrestrial.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20%20EXTRATERRESTRIAL%20-%20JINGO.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 11:55:10'),
(4878, 'DESPERATE SNIPER - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-1-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20%20%20DESPERATE%20SNIPER%20%282024%29%20JR.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 10:02:47'),
(4862, 'HAVOC - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/B7PUPsfnJxi7D5J9vHRVj9.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20HAVOC%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-06 05:15:38'),
(4513, 'The Spanish Prisoner', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p19881_v_h9_ac.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20The.Spanish.Prisoner.Mark.@Bryn%20Media%20Movie.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 21:04:02'),
(4516, 'Striking Rescue - VJ MUSA', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/48fce1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20Striking%20Rescue%20%282024%291080p%20MUSA.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 20:56:21'),
(4526, 'BAD NEIGHBORS 2 SORORITY RISING - VJ C.B', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/1_w5GWsmX86Wieyibjaq_fLA.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20BAD_NEIGHBORS_2_SORORITY_RISING_2025_VJ_C_B_1080p_%40MR_NO''S_ENT_0766009748.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 20:47:08'),
(4524, 'Treasure Hunter - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/v_176776043_m_601_en_1013_569.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20nTreasure.Hunter.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 20:42:33'),
(4682, 'ANGEL HAS FALLEN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAABbIkCzjYPIXsA5xMy7jebihHgVvUqFs7S_Pdiu-av-wFLPMtA0co4n0llPJfq-aLsaapz6kZ7fZ7J3D-ztcIbXvf7xKG7lQjs1yg.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.5%20%20%20EXTRATERRESTRIAL%20-%20JINGO.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 20:39:35'),
(4684, 'LONE SURVIVOR -  VJ  ICE', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p10020958_v_h8_ar.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20LONE%20SURVIVOR%20ICE.P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 20:35:41'),
(4688, 'ITS ALL ABOUT BENJAMIN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/photo-1.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20ITS%20ALL%20ABOUT%20BENJAMIN%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 20:21:20'),
(4690, 'I STILL KNOW WHAT YOU DID LAST SUMMER - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/I-Know-What-You-Did-Last-Summer-movies-review.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20I%20STILL%20KNOW%20WHAT%20YOU%20DID%20LAST%20SUMMER%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 20:06:24'),
(4692, 'Hitman 2 -  VJ ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/capsule_616x353.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20Hitman_2_2025%20ICE%20P.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 20:00:56'),
(4697, 'F1 THE MOVIE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/fi-the-movie-review.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20F1%20THE%20MOVIE%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 19:54:40'),
(4699, 'EENIE MEANIE - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/kHOfxq7cMTXyLbj0UmdoGhT540O.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20EENIE%20MEANIE%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 19:47:46'),
(4709, 'UNDER FIRE  - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-9.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/13%20UNDER%20FIRE%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 19:40:19'),
(4704, 'A FLYING JATT -  VJ SHIELD', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/rsz002467list.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20A%20FLYING%20JATT%2001.___VJ%20SHIELD.2025.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:54:25'),
(4701, 'BAMBI THE RECKONING - VJ  EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-16.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20BAMBI%20THE%20RECKONING%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:47:33'),
(4707, 'FALL FOR ME - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-15.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/14%20%20%20FALL%20FOR%20ME%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:40:01'),
(4711, 'WE BOUGHT A ZOO  - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/image_bb7ca345.jpeg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/13%20%20WE%20BOUGHT%20A%20ZOO%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:36:25'),
(4713, 'TRUST - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/8bf62fddee6f8461eb92713d4a11dd0cb8a21ac9ab7da258f6fe082d4597d380.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/13%20%20TRUST%20VJ%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:31:07'),
(4715, 'NOBODY 2 - VJ  EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/1920x1080list60b1b7177d3f4a3fb60bda0f811c28aaa5ec14ff9dde4080b92cd94dc6cbe7fd.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/13%20%20NOBODY%202%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:22:51'),
(4717, 'NOBODY 1 - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-14.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/13%20%20NOBODY%201%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:15:25'),
(4719, 'MISSION IMPOSSIBLE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/mission-impossible.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/13%20%20MISSION%20IMPOSSIBLE%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:10:14'),
(4721, 'MISSION IMPOSSIBLE 2 - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/MI2_SAlone_THM_16.9_1920x1080_1277857_1920x1080.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/13%20%20MISSION%20IMPOSSIBLE%202%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 18:05:24'),
(4723, 'SHALL WE DANCE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/shall-we-dance1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/13%20%20%20SHALL%20WE%20DANCE%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 15:58:28'),
(4725, 'Delivery Man - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/962f90a2f77a69ddf75737872e13bdecef9f66fa7d8af0dd894615993a47bfb4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.1%20Delivery.Man%20HD%20JR.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 15:55:00'),
(4727, 'DEMON CITY - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Demon-City-2025-Netflix-Review.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/DEMON%20CITY%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 15:51:25'),
(4729, 'CODE 8 PART II - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-13.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.1%20CODE%208%20PART%20II%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 15:46:53'),
(4731, 'Black Site - VJ Emmy', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-7.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.1%20Black%20Site%20by%20Vj%20Emmy.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 15:43:19'),
(4733, 'BROTHERS - VJ JUNIOR', '', 'video', '', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.1%20BROTHERS%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 15:40:15'),
(4735, 'BLADE OF FURY -  VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/MV5BN2RkZTY5YWEtMjRmNS00YTVmLWI4YTctZGIwOTM2NzU0NWViXkEyXkFqcGc@._V1_-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.1%20BLADE%20OF%20FURY%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 15:35:43'),
(4741, 'Black Crab -  Ice P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAABUT5ITdvccHIiREh9aSNjGxDKvZVJTc23OSeagqn8UqKlEB-240xpJ2MLDhWBIwvyTgbsVwrs43n83zgiKFTM6gVC5R5SwGZunma5HMJEf3V6Q0vu9WsEEUxi-GsvmKgCnpnXQ.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.1%20%20black%20crab-2022-Dual.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 13:33:29'),
(4746, 'ABOUT TIME - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/about-time-2013.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/12.1%20%20ABOUT%20TIME%20JR.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-05 13:29:53'),
(4518, 'Star Abyss - VJ Isma k', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/unnamed-3.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20Star.Abyss.2024.1080p.%20vj%20isma%20k.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 13:03:30'),
(4520, 'STORKS -  VJ Mosco', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/m-storks-1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20STORKS%20Vj%20Mosco.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:59:06'),
(4522, 'Elyas -  VJ MUSA', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-12.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20Elyas.2024.1080p%20VJ%20MUSA.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:49:16'),
(4528, 'NIGHT OF THE HUNTED - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/63f23c38-c94c-4a1c-a0d1-25ea6e7f7053.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20NIGHT%20OF%20THE%20HUNTED%20JR%202025%20%281%29.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:40:06'),
(4530, 'You Can''t Run Forever - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/unnamed-2-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20YOU%20CAN%20RUN%20A.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:36:16'),
(4533, 'The Beast Within', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/unnamed-1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20The%20Beast%20Within.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:28:41'),
(4536, 'WRONG PLACE WRONG TIME - VJ ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-11.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20WRONG%20PLACE%20WRONG%20TIME_____VJ%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:26:02'),
(4540, 'THE UNION - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/the-union-netflix.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20THE%20UNION%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:19:41'),
(4538, 'THUDARUM 02 -  VJ ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/20250423093202_thudarum-poster.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20THUDARUM%2002.___VJ%20ICE%20P.2025.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:15:03'),
(4558, 'MISSION CROSS - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/3143_8308_426.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20MISSION%20CROSS%20JR%202024%20%282%29.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 12:11:04'),
(4543, 'THE GANGSTAR, THE COP, THE DEVIL - VJ SHIELD', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/bvghvgh-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20THE%20GANGSTAR%2CTHE%20COP%2CTHE%20DEVIL___VJ%20SHIELD.2025.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:58:50'),
(4545, 'THE BEAST WITHIN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/unnamed-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20THE%20BEAST%20WITHIN%20JR%20MKV%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:52:16'),
(4547, 'SNIPER CN  - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Movie-Snipers-Featured.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20SNIPER%20CN%20____VJ%20JINGO.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:48:12'),
(4550, 'SNATCH UP -  VJ C.B', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/5b6545475a-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20SNATCH%20UP%20%5B2025%5D%20VJ%20C.B%201080p.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:44:51'),
(4552, 'SINNERS - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/sinnersmovie1-768x511-1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20SINNERS%20JR%202025.mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:40:55'),
(4554, 'Officer On Duty - VJ Jingo', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/officer-on-duty.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/11%20Officer%20on%20duty%20vj%20jingo.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:36:51'),
(4556, 'NEVER LET GO -  VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/1_SRYMx1rkhGwwIDeRE05ypw.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20NEVER%20LET%20GO%20VJ%20EMMY%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:33:31'),
(4561, 'MISSION CROSS - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/3143_8308_426.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20MISSION%20CROSS%20JR%202024%20%282%29.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:29:51'),
(4563, 'MAXIMUM IMPACT - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-6.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20MAXIMUM%20IMPACT%20JINGO%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:27:04'),
(4565, 'KILL - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-10.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20KILL%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:24:09'),
(4567, 'K.O - VJ SHIELD', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAABVaKNmhAFcSymzDc9aWNvZlsFxbi5_4ZMIoGU-ryR5060eTJlSvvbz4Q9SB-jclAxA-nwewaJNidWhm7vGQzebKVEVTh-IVl0Jwi8Kk3auEz6fXETpi7o2UOZeyJWB1bP9pUPg.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20K.O%20___VJ%20SHIELD.2025.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:20:10'),
(4569, 'GUNNER - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-5.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20GUNNER%20JR%202024%20%281%29.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:17:18'),
(4571, 'DRACULA UNTOLD - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAABcuXOv79syfqfc185qUJcTy-VcwBfKAGwss2z604jRAJz4vdjWMsANWIAMuGbrtu_jYfYw9EchGUjbSrESRqgsX-CbYz7txcNA.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src=""https://cdn.flixon.net/DRACULAUNTOLD%20JR.mp4"," type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:14:22'),
(4573, 'BORN OF HOPE - VJ C.B', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20BORN%20OF%20HOPE%20%5B2025%5D%20VJ%20C.B%201080p.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:07:56'),
(4575, 'AZAAD 02  - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/azaad.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20AZAAD%2002.___VJ%20JINGO.2025.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 06:04:40'),
(4577, 'THE DEAD THING -  VJ.ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/The-Dead-Thing-Shudder-Banner.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20%20THE%20DEAD%20THING%202025%20VJ.ULIO.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 05:58:57'),
(4579, 'ROGUE WARFARE - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/384fa88e66394e4ab6d54b571e6138a72bf066481fa48a11fd61e00aa1967a95.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20%20ROGUE%20WARFARE___VJ%20JINGO.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 05:54:31'),
(4581, 'OTHER PEOPLE''S MONEY -  VJ C.B', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/9ebb532669941b70c50cdf53398cb7f8d0762eeaeb2da365468c41413e89c0e9.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20%20OTHER%20PEOPLE''S%20MONEY%20%5B2025%5D%20VJ%20C.B%201080p.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-03 05:49:55'),
(3869, 'The Invitation - Ice P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAABcDe-NXykvQ-Q1CsxUZAxt8oBkji5T0S_baY4M8xjXUHILfOW_hegSx9XHUllszt1PLiWm-4yq4bXpM1Nz8T1eIsWOTI2Er1VMMc.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/81.1%20%20%20video_2025-10-19_05-57-00.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 10:55:55'),
(3784, 'McKenna Shoots For The Stars - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-9.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/VJ%20junior%20Translated%20Movies%202025%F0%9F%94%A5.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 10:39:25'),
(4116, 'NIGHT OF THE HUNTED - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/63f23c38-c94c-4a1c-a0d1-25ea6e7f7053.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20NIGHT%20OF%20THE%20HUNTED%20JR%202025%20%281%29.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 10:17:58'),
(4121, 'MOTHER OF THE BRIDE - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/mother-of-bride-2024.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20MOTHER%20OF%20THE%20BRIDE%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 08:30:11'),
(4118, 'NEXT FRIDAY - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/CPwDEJ0COgUxLjEuOA.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20NEXT%20FRIDAY%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 08:24:00'),
(4125, 'FRIDAY - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/friday_-_h_-_1995.webp', '<!-- Responsive MP4 Player - 100% width, 16:9 aspect ratio -->
<div style="position: relative; width: 100%; margin: 0 auto;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
    <iframe src="https://www.livereacting.com/tools/mp4-player-embed?url=https%3A%2F%2Fpub-7f5e23d0e72b40d798d7559968459702.r2.dev%2F15.1%2520FRIDAY%2520JR%25202025.mkv" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            frameborder="0" allowfullscreen>
    </iframe>
  </div>
</div>', '2025-11-02 08:17:24'),
(4123, 'LAWS OF MAN -  VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/unnamed-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20LAWS%20OF%20MAN%20VJ%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 08:11:48'),
(4135, 'Robosapien: Rebooted - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/sddefault-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%21ROBOSAPIEN.REBOOTED___VJ%20EMMY.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 08:06:33'),
(4137, 'WOLF HIDING  - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/v_175601840_m_601_en_m1_1013_569.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20WOLF%20MAN%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 08:00:11'),
(4161, 'Atlas  -VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/ATLAS-NETLIX-SCI-FI-MOVIE-REVIEW.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20Atlas%20EMMY.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 07:52:39'),
(4127, 'Curse Of The Piper - VJ  EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p25588963_v_h10_ai.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20Curse%20Of%20The%20Piper%20EMMY.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 07:49:24'),
(4129, 'BLOCKING THE HORSE - ICE', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/v_175607635_m_601_en_1080_608.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20BLOCKING%20THE%20HORSE%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 07:35:44'),
(4131, 'ASSUALT TEAM  - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/sddefault-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20ASSUALT%20TEAM%20VJ%20JINGO%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 07:29:33'),
(4139, 'ALEXANDER AND THE TERRIBLE,HORRIBLE NO_GOOD, VERY BAD DAY  - JR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/388fdaa2ca78e745c3f7ca29e97cb0abb796099c084951417e1736f1c9bde925.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20ALEXANDER_AND_THE_TERRIBLE%2CHORRIBLE%2CNO_GOOD%2C_VERY_BAD_DAY_JR.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 07:23:17'),
(4143, 'The Owners - VJ Jingo', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/5f68d6109877983.5fe08ac90b934.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20The%20Owners%20-%20VJ%20Jingo.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 07:15:45'),
(4141, 'UNSUNG HERO - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/015c6a-6553-7510-f7ee-a7484c6e1_UnsungHero-Poster-Horizontal.jpeg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20UNSUNG%20HERO%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 07:09:33'),
(4155, 'SHES OBSESSED WITH MY HUSBAND - VJ ISMA K', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-8.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20SHES%20OBSESSED%20WITH%20MY%20HUSBAND%20-%20VJ%20ISMA%20K.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 06:11:03'),
(4147, 'THE STRATUM  - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20THE%20STRATUM%20ICE%20P.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 06:00:43'),
(4152, 'THE 8TH DAY - VJ ISMA K', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/2db766af6a0b9387b950d8209b5723df45b0fcdaf0b7385f875e7b34ed4a6e6d.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20THE%208TH%20DAY%20-%20VJ%20ISMA%20K.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 05:56:00'),
(4149, 'THE MINISTRY OF UNGENTLEMANLY WARFARE - JR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/4605ffe7-c0f7-4ef4-8d67-367defe9e647.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20THE%20MINISTRY%20OF%20UNGENTLEMANLY%20WARFARE%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 05:49:57'),
(4157, 'PRESUMED INNOCENT - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-7.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20PRESUMED%20INNOCENT%20%283%29%20JR%202024.mkv">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 05:45:24'),
(4159, 'BOY KILLS THE WORLD - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20BOY%20KILLS%20THE%20WORLD%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 05:39:01'),
(4163, 'ATLAS - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/ATLAS-NETLIX-SCI-FI-MOVIE-REVIEW.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20ATLAS%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 05:33:24'),
(4165, 'ABIGAIL  - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-5.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20ABIGAIL%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 05:29:00'),
(4199, 'The Other Man', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/3440735-1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20%20The%20Other%20Man.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 05:23:48'),
(4167, 'THE SIEGE OF JADOTVILLE - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20%20THE%20SIEGE%20OF%20JADOTVILLE%20VJ%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 05:06:28'),
(4169, 'LIFE AFTER FIGHTING - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-3.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20%20LIFE%20AFTER%20FIGHTING%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:57:17'),
(4171, 'FIREWIRE SNIPER - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20%20FIREWIRE%20SNIPER%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:49:31'),
(4173, 'Civil War - EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/hq720.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20%20Civil%20War%20EMMY.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:44:58'),
(4175, 'CHIEF OF STATION - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/0a3f931b-28d1-48c6-9e33-dbc332912bc1.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20%20%20CHIEF%20OF%20STATION%20JR%202024.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:38:08'),
(4177, 'THE LOOK AWAY - VJ.ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Look-Away.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20THE%20LOOK%20AWAY%202025%20VJ.ULIO.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:29:00'),
(4179, 'THE DEAD THING - VJ.ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/The-Dead-Thing-Shudder-Banner.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/16%20%20%20THE%20DEAD%20THING%202025%20VJ.ULIO.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:23:49'),
(4181, 'THE BRUTALIST - VJ.ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/images-original.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20THE%20BRUTALIST%202025%20part%201%20VJ.ULIO.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:17:25'),
(4183, 'Sylvie''s Love - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/sylvies-love.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20SYLVIES%20LOVE%20JR.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:10:54'),
(4185, 'LITTLE MERMAID - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/647ce3403f84cd001d40f3a8.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20LITTLE%20MERMAID.VJ%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 04:04:21'),
(4187, 'HIGH ROLLERS -  VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/sddefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20HIGH%20ROLLERS%20VJ%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 03:54:42'),
(4189, 'Gunner Dad  - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/maxresdefault-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20Gunner%20Dad.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 03:50:31'),
(4193, 'CAPTAIN AMERICA BRAVE NEW WORLD  - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/excited-for-captain-america-brave-new-world-but-it-s-missing-the-1-thing-that-made-the-winter-soldier-so-iconic2.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20CAPTAIN%20AMERICA%20BRAVE%20NEW%20WORLD%20JR.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 03:46:13'),
(4195, 'BONHOEFFER - VJ.ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Bonhoeffer-film.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20BONHOEFFER%20HD.2025%20VJ.ULIO.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 03:42:28'),
(4197, 'A COMPLETE UNKNOWN 2025 - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/mqdefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20A%20COMPLETE%20UNKNOWN%202025%20VJ.ULIO.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 03:37:07'),
(4201, 'The Other Man  - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/3440735.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20%20The%20Other%20Man.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 03:28:03'),
(4203, 'HOODLUM   VJ Emmy.mp4', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/p19852_v_h8_ae.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20%20HOODLUM%20%20%20VJ%20Emmy.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 03:23:15'),
(4205, 'Acrimony - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/Childproof-4.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15%20%20Acrimony%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-02 03:15:32'),
(4112, 'WOLF MAN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/AAAABVAdGLaV6_bAmQkScumvhyqY_T5iuHMHheuvW_AKWAXbYr8EPNzI_B1o7n8s8prAspUimTMjlq24R1_hfGiLFGPqIs2I1LSGwUOYCaRL63YjrddHujp32_I7qdsNwZOCpV75lg.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/15.1%20WOLF%20MAN%20JR%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-01 06:31:03'),
(3850, 'KILL CRAFT -  ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/c795386abd22eee0bf3cb0244da0b5872dd777fcffcc55de9f9a6de15ac99f71.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/91%20%20KILL%20CRAFT%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-01 05:31:29'),
(3858, 'Overboard - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/11/28951945_938892196267501_8949082252667518976_o.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/81.1%20overboard.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-11-01 05:27:45'),
(3844, 'Assassination of a high school student', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/LTV-TW-001-A0084-P448.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/91%20assassination%20of%20a%20highschool%20student%20jr%20-%20Movie%201.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 21:41:13'),
(3846, 'Detective Knight- Independence by Vj Ice P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/2b4948d088645cee8efed314df35a3ac_1703314229363_l_medium.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/91%20Detective%20Knight-%20Independence%20by%20Vj%20Ice%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 21:34:51'),
(3848, 'MONSTER TRUCK - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/MNTRK_US_2017_SA_16x9_1920x1080_2742523_1920x1080.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/91%20%20MONSTER%20TRUCK%20-%20EMMY.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 21:18:54'),
(3852, 'Bladesman 2  - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/lostbladesman.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/91%20%20Bladesman%202%202020.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 21:11:31'),
(3876, 'Viking Ulven - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/AAAABVAdGLaV6_bAmQkScumvhyqY_T5iuHMHheuvW_AKWAXbYr8EPNzI_B1o7n8s8prAspUimTMjlq24R1_hfGiLFGPqIs2I1LSGwUOYCaRL63YjrddHujp32_I7qdsNwZOCpV75lg.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20Viking%20Ulven%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 21:05:27'),
(3905, 'STORKS - VJ Mosco', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/264172-storks_.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20STORKS%20Vj%20Mosco.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 21:00:56'),
(3878, 'The Pope''s Exorcist  -  Ice P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-9.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20The%20Pope''s%20Exorcist%20%20%20Ice%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 04:08:54'),
(3881, 'The Graduate - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/graduatecovre.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20The%20Graduate%20-%20VJ%20Emmy.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 04:02:06'),
(3885, 'Paradox Effect - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/MV5BZjFlYWJhOGMtODQ1Zi00MjRhLTgzMDctYzU4NDFmZWVkYmIwXkEyXkFqcGc@._V1_.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20Paradox%20Effect%20%20%20%20-%20%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 03:50:50'),
(3883, 'The Bee keeper - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/0b1b71e8d1c113e6075c8a9250fb62cd05ad7851d667989bd7e0e25b43adda82-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20The%20Bee%20keeper%20%20%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 03:50:29'),
(3887, 'Night Swim - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/2-4f79bbde2395afe6778b6d05b17789cc-scaled.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20Night%20Swim%20%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 03:42:15'),
(3889, 'Monkey Man - Vj Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/monkey-man-1.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20Monkey%20Man%20-%20Vj%20Junior.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 03:41:26'),
(3891, 'Get Hard - VJ Junior.', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p11003109_v_h10_ac.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20Get%20Hard%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 03:26:53'),
(3893, 'Extraction 2 - VJ juinior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-8.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20Extraction%20VJ%20juinior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 03:22:04'),
(3895, 'Blood & Gold - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/hqdefault-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/79.9%20Blood%20%26%20Gold%20%20%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-31 03:11:47'),
(3897, 'Trading Places - VJ Mark', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/trading-places-1983.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20Trading.Places.Mark.%40Bryn%20Media%20Movie.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 22:33:07'),
(3899, 'The Spanish Prisoner -  VJ Mark', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/65a52490b01b86b1010fdd611169296df4603224df13e82238007da5e604e81d-1-scaled.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20The.Spanish.Prisoner.Mark.%40Bryn%20Media%20Movie.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 22:31:37'),
(3901, 'Striking Rescue - VJ  MUSA', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/59bc9223a27d8111c80e78bd3afb1024ed6c18ef7742d814f16c3ba205391e61-scaled.png', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20Striking%20Rescue%20(2024)1080p%20MUSA.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 22:23:56'),
(3903, 'Star Abyss - VJ Isma', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-7.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20Star.Abyss.2024.1080p.%20vj%20isma%20k.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 22:18:25'),
(3907, 'Elyas - VJ MUSA', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-6.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/6.1%20Elyas.2024.1080p%20VJ%20MUSA.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 22:13:27'),
(3920, 'Yogi Bear  - VJ UNCLE T', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/X0_6863207798e47_3600-scaled.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20VJ%20UNCLE%20T%20Yogi.Bear.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 22:09:49'),
(3942, 'About My Father - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/hq720-4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20About%20My%20Father%20-%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 22:04:39'),
(3922, 'Unleashed - VJ Jingo', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/3f30b42760dc73209d71820ff18ebb780cd0c8d6524b061aa499956b1d9714f8.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20Unleashed%20-%20VJ%20Jingo.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 10:38:17'),
(3924, 'NOCEBO - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/NOCEBO_Quad_New-UK-Poster.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20NOCEBO%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 10:32:52'),
(3926, 'Max Cloud -  ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/86f73ecd5d9b5f37be66702ea7c14ecdd73ddb058870d0e89e45d1d291ebf8cf.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20Max%20Cloud%20-%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 10:27:45'),
(3928, 'Met A Girl - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-5.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20I%20met%20A%20Girl%20%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 10:21:19'),
(3930, 'Halloween Ends - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/nnnb-Header-New.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20Halloween%20Ends%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 10:14:39'),
(3932, 'GAME CHANGER PRT 2 - VJ Jingo', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/game-changer-release-1600.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20GAME%20CHANGER%20PRT%202%20VJ%20JINGO%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 09:58:54'),
(3934, 'Forever First Love', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/CPwDEJ0COgUxLjEuOA.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20Forever%20First%20Love.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 09:49:59'),
(3936, 'Fire Starter - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/104828918-1.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20Fire%20Starter%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 09:43:37'),
(3938, 'Diary Of A Wimpy Kid - VJ Kevo', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-2-2.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20Diary%20Of%20A%20Wimpy%20Kid%20-%20VJ%20Kevo.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 09:40:02'),
(3944, 'AGENTS - VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p28203262_v_h9_aa.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20AGENTS%20%20VJ%20%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 09:34:04'),
(3956, 'BACK TO SCHOOL 2025-  VJ EMMY', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/Back-to-School-movie-cast.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/BACK%20TO%20SCHOOL%20VJ%20EMMY%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 09:25:07'),
(3960, 'Locked In - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/104828918.avif', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Locked%20In%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 09:13:42'),
(3962, 'MIDNIGHT MAN - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p14793222_v_h8_ac.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/MIDNIGHT.MAN.VJ%20JINGO%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 09:10:25'),
(3964, 'NEVER LET GO - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-2-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/NEVER%20LET%20GO%20%5B2024%5D%20VJ%20JUNIOR%201080p%20MEDIA%20FISIT%20FULL%20HD%20MOVIES.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 08:57:03'),
(3966, 'WILD THINGS - VJ ULIO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p20816_v_h10_ak.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/WILD%20THINGS%20-VJ_ULIO.HD720P.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-30 08:52:21'),
(3946, 'A Nice Girl Like You - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/Title-Card-A-Nice-Girl-Like-You.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20A%20Nice%20Girl%20Like%20You%20-%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-28 21:49:33'),
(3940, 'COUNTER STRIKE  - VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/hq720-3.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/1.111%20COUNTER%20STRIKE%20VJ%20JINGO%20%202025.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-28 20:21:48'),
(3841, 'Ant Man And The Wasp Quantumania -', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/ant-man-quantumania-genre-mcu-marvel.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Ant-Man%20and%20the%20Wasp-%20Quantumania%20by%20Vj%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-26 14:46:58'),
(3775, 'Counter Attack - ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p20799582_v_h8_ab.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Counter%20Attack%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-20 02:14:29'),
(3769, 'Day Shift -  ICE P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p21575369_v_h8_aa.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Day%20Shift%20%20%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-20 01:53:10'),
(3765, 'EXTRACTION  - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/RgOWIjNBqW2ASCmQ3wuGb5GAYnDSRHd1EMipCwJI.jpeg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/EXTRACTION%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-20 01:29:42'),
(3761, 'Fantasy Island - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p17297485_v_h8_ah.jpg', 'https://pub-7f5e23d0e72b40d798d7559968459702.r2.dev/Fantasy%20Island%20-%20VJ%20Junior.mp4', '2025-10-20 01:20:45'),
(3757, 'Finding You - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p19249478_v_h8_aa.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Finding%20You.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-20 01:11:57'),
(3753, 'Hot Boyz - Vj Emmy', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/MV5BOTEwODgyMTEtYzI5Ni00OGQwLWIzZjktNzIwZDRiNzI4MDVkXkEyXkFqcGc@._V1_.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Hot%20Boyz%20by%20Vj%20Emmy.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-20 00:46:47'),
(3749, 'I, ROBOT -  VJ Emmy', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/i_robot_coverart_1600x686_9ea2d6f6.jpeg', '<div style="position: relative; width: 100%; padding-top: 56.25%; background: #000; border-radius: 8px; overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
  >
      <source src="https://cdn.flixon.net/I%2C%20ROBOT%20%20VJ%20Emmy.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-20 00:41:43'),
(3742, 'Moon Fall - Ice P', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/16435651899742.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Moon%20Fall%20-%20Ice%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-20 00:31:03'),
(3740, 'On The Line  VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/thumb_AF7A36AE-168B-4B45-8872-0BF38EC981DA.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/On%20The%20Line%20%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-20 00:12:20'),
(3719, 'PRISONER OF LOVE - JV Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/m.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/PRISONER%20OF%20LOVE%20JR.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 14:15:01'),
(3715, 'Real Steel - VJ Isma K', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-1-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Real%20Steel%20-%20VJ%20Isma%20K.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 13:58:56'),
(3707, 'Row 19 -    VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p21035644_v_h8_ab.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Row%2019%20VJ%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 13:50:52'),
(3703, 'Run the Race    VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/169496a4d1def945264f45e5b17d2cd1ef54c5de5ee51988ec17513dee1c069e.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Run%20the%20Race%20VJ%20Junior%20%20%20Sport%20Drama.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 13:44:15'),
(3699, 'Solomon Kane   VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/maxresdefault-4.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Solomon%20Kane%20VJ%20Junior%20%20%20Adventure%20Action.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 13:39:50'),
(3691, 'THE LIGHT YEAR - KEVO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/lightyear-review-1.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/THE%20LIGHT%20YEAR%20-%20KEVO%5BJB%20HD%20movies%5D.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 13:31:52'),
(3687, 'The Lucky One - Vj Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/eb74e9355ee638b5c15ab7bc212a71cc222f85c09f96a43b98f8086aeeca6a15.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/The%20Lucky%20One%20Vj%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 13:02:56'),
(3683, 'Trespassers - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p8014456_v_h9_aa.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Trespassers%20-%20Vj%20Junior.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 12:54:21'),
(3679, 'The Little Things - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/l204_38291612166527.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/the%20little%20things.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-19 12:50:08'),
(3584, 'AMERICAN MUSCLE -  VJ JINGO', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/Heropage-980x560_93.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/AMERICAN%20MUSCLE%20VJ%20JINGO.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-18 14:17:31'),
(3578, 'A Predator Returns -  vj junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/06d6cddf01fe4794d3516dd149f4f3ab95abd9bf779153d60cf9b873318428e8-scaled.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/A%20Predator%20Returns%20vj%20junior.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-18 14:08:28'),
(3574, 'BREAK THROUGH - ICE P.', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/dc85eb92f1360fe461f5f9ea72b13e54875da0d49076ffcb0f5d5a8b4c65e429.webp', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/BREAK%20THROUGH%20ICE%20P.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-18 14:03:44'),
(3570, 'DESPERATE MEASURES - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/hqdefault.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/DESPERATE%20MEASURES%20VJ%20JUNIOR%202025.%20NEW%20RELEASE%20MOVIE._2.mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-18 13:57:26'),
(3566, 'Fashionably Yours - VJ junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/MV5BYTY3NTExMWUtODMzOC00ZmU3LThhZDctNzQ3YmQ2YWQyYmU5XkEyXkFqcGc@._V1_.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Fashionably%20Yours%20vj%20junior.mkv" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-18 13:50:49'),
(3562, 'Get Fast - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/p28464390_k_h9_ac.jpg', '<!-- Full-width & full-height responsive video player -->
<div style="position: relative; width: 100%; padding-top: 56.25%; /* 16:9 aspect ratio */ overflow: hidden;">
  <video 
      controls 
      preload="metadata" 
      poster="https://cdn.flixon.net/your-poster.jpg"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
  >
      <source src="https://cdn.flixon.net/Get-Fast%20(1).mp4" type="video/mp4">
      Your browser does not support the video tag.
  </video>
</div>', '2025-10-18 13:47:41'),
(3555, 'IF I RUN - VJ JUNIOR', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/VJICS46QWRECJJGVQJGZOHE4KE.avif', 'https://pub-7f5e23d0e72b40d798d7559968459702.r2.dev/IF%20I%20RUN%202025..VJ%20JUNIOR%20NEW%20TRANSLATED%20MOVIES.VJ%20EMMY%20VJ%20JINGO.mp4', '2025-10-18 13:37:52'),
(3550, 'The Legend of Sarila - VJ Martin', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/b9d2721a71eed18a04c2d88c0978d560e844669287a326c58a89b4ecb0eaf497.jpg', 'https://pub-7f5e23d0e72b40d798d7559968459702.r2.dev/The.Legend.of.Sarila%20Vj%20Martin%20k.mp4', '2025-10-18 13:31:44'),
(3546, 'VJ Junior Translated Movie', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/AFM22_Millenniumfilms_MAIN.webp', 'https://pub-7f5e23d0e72b40d798d7559968459702.r2.dev/Vj%20Junior.%20Vj%20jingo.%20Vj%20Emmy%20.%20Omutaka%20ice%20p%20Luganda%20translated%20movies%202025_2.mp4', '2025-10-18 13:21:39'),
(3533, 'Naked soldier - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/test_pic1629230098073.jpg', '<!-- Responsive MP4 Player - 100% width, 16:9 aspect ratio -->
<div style="position: relative; width: 100%; margin: 0 auto;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
    <iframe src="https://www.livereacting.com/tools/mp4-player-embed?url=https%3A%2F%2Fpub-7f5e23d0e72b40d798d7559968459702.r2.dev%2FNaked%2520soldier.%2520Vj%2520Junior%2520movie%25202025.%2520%25E2%2580%2593%2520CINEMA%2520TRACK.mkv" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
            frameborder="0" allowfullscreen>
    </iframe>
  </div>
</div>', '2025-10-18 12:53:13'),
(3530, 'What''s Your Number - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/1200x675CA.TVA23C01-1.webp', 'https://pub-7f5e23d0e72b40d798d7559968459702.r2.dev/watch%20What''s%20Your%20Number.%20translated%20by%20vj%20junior%20in%20luganda%20free%20-%20vj%20junior%20movies%20-%20translated%20movies.mp4', '2025-10-18 12:43:25'),
(3480, 'LUGANDA TRANSLATED MOVIE - VJ Junior', '', 'video', 'https://flixon.net/wp-content/uploads/2025/10/hq720-1.webp', 'https://pub-7f5e23d0e72b40d798d7559968459702.r2.dev/%23vjjunior%20%23vjemmy%20%20LUGANDA%20TRANSLATED%20MOVIE--EKIRO%20KY''ABAYIGGANYIZIBWA%202025%20DON''T%20MISS%20%F0%9F%94%A5.mp4', '2025-10-17 05:20:58')
ON CONFLICT (id) DO NOTHING;

