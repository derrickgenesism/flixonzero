const { revalidatePath, revalidateTag } = require('next/cache');

async function purge() {
  console.log('Cache purged');
}
purge();
