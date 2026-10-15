-- Mock data for development. Run once in the Supabase SQL Editor.
--
-- To start over, run these two lines first (this also deletes anything that
-- points at the pets later, such as favorites and applications):
--   delete from public.pets;
--   delete from public.shelters;

insert into public.shelters (name, city, phone, email, distance_miles) values
  ('Heart Shelter',        'New York, NY',     '555-0101', 'heartshelter@example.com',   2),
  ('PetLove Rescue',       'Brooklyn, NY',     '555-0102', 'petlove@example.com',        4),
  ('Safe Harbor Shelter',  'Hoboken, NJ',      '555-0103', 'safeharbor@example.com',     5),
  ('Meadowbrook Rescue',   'Yonkers, NY',      '555-0104', 'meadowbrook@example.com',   18),
  ('Hillside Animal Haven','Stamford, CT',     '555-0105', 'hillside@example.com',      38),
  ('Riverbend Shelter',    'Poughkeepsie, NY', '555-0106', 'riverbend@example.com',     72);

insert into public.pets (shelter_id, species, name, breed, age_months, sex, energy, intro)
select s.id, v.species, v.name, v.breed, v.age_months, v.sex, v.energy, v.intro
from (values
  ('Heart Shelter', 'cat', 'Max', 'American Shorthair', 6, 'female', 4,
   'Max is a curious, affectionate stray who found her way to Heart Shelter a few months ago. She loves climbing, chasing string toys and napping in sunny spots. She is looking for a patient home where she can keep exploring.'),
  ('PetLove Rescue', 'dog', 'Rocky', 'Husky', 24, 'male', 5,
   'Rocky is a big-hearted husky with striking blue eyes and boundless energy. He thrives on long runs and needs a family that loves the outdoors as much as he does.'),
  ('Safe Harbor Shelter', 'cat', 'Luna', 'Tuxedo', 12, 'female', 2,
   'Luna is a calm tuxedo cat who loves gentle play and quiet evenings on the sofa. She is great with kids and would suit a relaxed household.'),
  ('Heart Shelter', 'dog', 'Bruno', 'Beagle', 36, 'male', 4,
   'Bruno follows his nose everywhere and greets every person like a long-lost friend. He is food motivated, which makes training a joy.'),
  ('Hillside Animal Haven', 'dog', 'Biscuit', 'Labrador mix', 84, 'male', 2,
   'Biscuit is a gentle senior who enjoys slow walks, soft beds and a good belly rub. He has plenty of love left to give and does best in a quiet home.'),
  ('Safe Harbor Shelter', 'cat', 'Nina', 'Calico', 36, 'female', 3,
   'Nina is a friendly calico with a talkative streak. She enjoys window watching and will happily supervise whatever you are doing.'),
  ('Meadowbrook Rescue', 'dog', 'Coco', 'Poodle mix', 18, 'female', 3,
   'Coco is a fluffy, clever pup who learns new tricks in minutes. She loves cuddles and is happy with a mix of play and naps.'),
  ('Meadowbrook Rescue', 'cat', 'Oliver', 'Maine Coon', 48, 'male', 2,
   'Oliver is a gentle giant with a plush coat and a soft purr. He prefers lap time over zoomies and gets along well with other cats.'),
  ('Heart Shelter', 'dog', 'Daisy', 'Golden Retriever', 8, 'female', 4,
   'Daisy is a bouncy golden puppy who adores people and water. She is just starting to learn her manners and needs a family ready for puppy classes.'),
  ('PetLove Rescue', 'cat', 'Milo', 'Orange tabby', 3, 'male', 5,
   'Milo is a tiny, fearless orange kitten who turns every shoelace into an adventure. He will keep you laughing from morning to night.'),
  ('Hillside Animal Haven', 'dog', 'Bella', 'German Shepherd mix', 60, 'female', 4,
   'Bella is loyal, smart and always eager to have a job to do. She would love an active owner who enjoys training and long walks.'),
  ('Riverbend Shelter', 'cat', 'Simba', 'Siamese', 96, 'male', 1,
   'Simba is a dignified senior Siamese who loves a warm lap and quiet company. He is looking for a calm home to enjoy his golden years.'),
  ('Riverbend Shelter', 'dog', 'Charlie', 'Corgi', 30, 'male', 4,
   'Charlie is a short-legged ball of joy who herds socks and squeaky toys. He is playful, sociable and always up for a game.'),
  ('Meadowbrook Rescue', 'cat', 'Cleo', 'Russian Blue', 72, 'female', 2,
   'Cleo is a shy, elegant Russian Blue who blossoms once she trusts you. She does best with patient owners and a peaceful routine.'),
  ('Safe Harbor Shelter', 'dog', 'Duke', 'Pit Bull mix', 48, 'male', 3,
   'Duke is a sweet, goofy softie who leans against your legs for attention. He is good on a leash and thrives with a steady routine.'),
  ('Hillside Animal Haven', 'cat', 'Pepper', 'Domestic Shorthair', 9, 'female', 5,
   'Pepper is a sleek black kitten with big golden eyes and endless energy. She loves chasing toys and would do well with a playful companion.')
) as v(shelter, species, name, breed, age_months, sex, energy, intro)
join public.shelters s on s.name = v.shelter;