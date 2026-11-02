import cloudinary from "../config/cloudinary";

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

export const subirImagenCloudinary = (
  fileBuffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary no retornó resultado"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(fileBuffer);
  });
};
