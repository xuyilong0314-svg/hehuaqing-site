// Keep the file chooser synchronous. Saving starts only after a file is chosen.
// If saving fails, upload never starts and the form remains available for retry.
export async function saveThenUpload({files,needsSave,validate,save,upload,onProgress=()=>{}}) {
  if(!files.length)return;
  await validate(files);
  if(needsSave){onProgress('正在保存当前观察…');await save();}
  onProgress('正在处理并上传照片…');
  await upload(files);
}
