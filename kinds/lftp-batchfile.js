export default function(options){
    return {
      
      remove: {
        order: ['tar', 'zip', 'mp3', 'png', 'jpg', 'SHA256SUM'],
        template: ({ name, destination }) => `rm "${destination}/${name}"`,
        filter: null
      },

      create: {
        order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
        template: ({ name, source, destination }) => `mkdir -p "${destination}"\nput "${source}/${name}" -o "${destination}/${name}"`,
      },

      update: {
        order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
        template: ({ name, source, destination }) => `put "${source}/${name}" -o "${destination}/${name}"`,
      },

    }
}