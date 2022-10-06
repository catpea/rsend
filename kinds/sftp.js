export default function(options){
    return {
      
      remove: {
        disable: true,
        order: ['tar', 'zip', 'mp3', 'png', 'jpg', 'SHA256SUM'],
        execute: ({ name, destination }) => `rm "${destination}/${name}"`,
        filter: null
      },

      create: {
        order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
        initialize: ({ destination, name }) => `mkdir "${destination}/${name}"`,
        execute: ({ name, source, destination }) => `put "${source}/${name}" "${destination}/${name}"`,
        // filter: file=>path.extname(file)==='.html'
      },

      update: {
        order: ['tar', 'zip', 'mp4', 'mp3', 'png', 'jpg', 'txt', 'html', 'SHA256SUM'],
        execute: ({ name, source, destination }) => `put "${source}/${name}" "${destination}/${name}"`,
        // filter: file=>path.extname(file)==='.html'
      },

    }
}
