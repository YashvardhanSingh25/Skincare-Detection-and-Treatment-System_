import sqlite3
conn=sqlite3.connect('schedule.db')
conn.execute("UPDATE schedule_metadata SET scan_image='' WHERE scan_image LIKE 'blob:%'")
conn.commit()
conn.close()
print('Cleaned broken blobs')
