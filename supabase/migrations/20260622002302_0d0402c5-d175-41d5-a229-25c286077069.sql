CREATE POLICY "Realtime promocoes topic public read"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (
  realtime.topic() = 'promocoes'
);