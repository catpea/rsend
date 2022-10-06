export default function(options){
    return {
      
      remove: {
        order: ['tar', 'zip', 'mp3', 'png', 'jpg', 'SHA256SUM'],
        execute: ({ name, destination }) => `rm "${destination}/${name}"`,
        filter: null
      },

      create: {
        order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
        initialize: ({directory, directories}) => `mkdir -p "${directory}"`,
        execute: ({ name, source, destination }) => `put "${source}/${name}" -o "${destination}/${name}"`,
      },

      update: {
        order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
        execute: ({ name, source, destination }) => `put "${source}/${name}" -o "${destination}/${name}"`,
      },

    }
}
