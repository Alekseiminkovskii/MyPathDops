import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

interface Job {
  id: number
  site_name: string
  status: string
  date: string
}

interface Photo {
  id: number
  url: string
  label: string
  taken_at: string | null
  lat: number | null
  lng: number | null
}

interface Props {
  job: Job
  photos: Photo[]
}

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#fff' },
  coverPage: { padding: 60, flexDirection: 'column', flex: 1 },

  // Cover
  badge: { fontSize: 9, color: '#888', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 40 },
  siteName: { fontSize: 28, fontFamily: 'Helvetica-Bold',
    color: '#111', marginBottom: 24, lineHeight: 1.2 },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginBottom: 24 },
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoLabel: { fontSize: 10, color: '#888', width: 90 },
  infoValue: { fontSize: 10, color: '#111', fontFamily: 'Helvetica-Bold' },
  statusBadge: { fontSize: 9, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4, backgroundColor: '#e8f5e9', color: '#2e7d32' },
  coverFooter: { position: 'absolute', bottom: 40, left: 60, right: 60,
    borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 12,
    flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#aaa' },

  // Photos page
  photosPage: { padding: 32 },
  pageHeader: { fontSize: 8, color: '#aaa', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 20, borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: { width: '48%', marginBottom: 16 },
  photoImg: { width: '100%', height: 160, objectFit: 'cover',
    borderRadius: 4, marginBottom: 6 },
  photoLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold',
    color: '#111', marginBottom: 2 },
  photoMeta: { fontSize: 8, color: '#888' },
  photoGps: { fontSize: 7, color: '#aaa', marginTop: 1 },
  photoNum: { fontSize: 7, color: '#ccc', marginTop: 2 },

  // No photos
  noPhotos: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noPhotosText: { fontSize: 12, color: '#aaa' },
})

function CoverPage({ job }: { job: Job }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.coverPage}>
        <Text style={s.badge}>Closeout Package</Text>
        <Text style={s.siteName}>{job.site_name}</Text>
        <View style={s.divider} />

        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Job ID</Text>
          <Text style={s.infoValue}>#{job.id}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Status</Text>
          <Text style={[s.infoValue, { color: '#2e7d32' }]}>{job.status}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Work Date</Text>
          <Text style={s.infoValue}>{job.date}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Generated</Text>
          <Text style={s.infoValue}>{new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}</Text>
        </View>

        <View style={s.coverFooter}>
          <Text style={s.footerText}>MyPathDops Field Operations</Text>
          <Text style={s.footerText}>CONFIDENTIAL</Text>
        </View>
      </View>
    </Page>
  )
}

function PhotosPage({ photos, jobName, pageNum }: {
  photos: Photo[]
  jobName: string
  pageNum: number
}) {
  return (
    <Page size="A4" style={s.photosPage}>
      <View style={s.pageHeader}>
        <Text>{jobName}</Text>
        <Text>Page {pageNum}</Text>
      </View>
      <View style={s.photoGrid}>
        {photos.map((photo, i) => (
          <View key={photo.id} style={s.photoCard}>
            <Image src={photo.url} style={s.photoImg} />
            <Text style={s.photoLabel}>{photo.label}</Text>
            {photo.taken_at && (
              <Text style={s.photoMeta}>
                {new Date(photo.taken_at).toLocaleString('en-US')}
              </Text>
            )}
            {photo.lat && photo.lng && (
              <Text style={s.photoGps}>
                {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
              </Text>
            )}
            <Text style={s.photoNum}>Photo #{(pageNum - 2) * 4 + i + 1}</Text>
          </View>
        ))}
      </View>
    </Page>
  )
}

export function COPDocument({ job, photos }: Props) {
  // Разбиваем фото по 4 на страницу
  const pages: Photo[][] = []
  for (let i = 0; i < photos.length; i += 4) {
    pages.push(photos.slice(i, i + 4))
  }

  return (
    <Document>
      <CoverPage job={job} />
      {photos.length === 0 ? (
        <Page size="A4" style={s.page}>
          <View style={s.noPhotos}>
            <Text style={s.noPhotosText}>No photos in this job</Text>
          </View>
        </Page>
      ) : (
        pages.map((pagePhotos, i) => (
          <PhotosPage
            key={i}
            photos={pagePhotos}
            jobName={job.site_name}
            pageNum={i + 2}
          />
        ))
      )}
    </Document>
  )
}