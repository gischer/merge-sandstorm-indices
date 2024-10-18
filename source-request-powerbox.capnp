# sot-images-powerbox.capnp

@0xcfccbfe520edfaf1;

using Powerbox = import "/sandstorm/powerbox.capnp";
using ApiSession = import "/sandstorm/api-session.capnp".ApiSession;

# Tag value

const sourceIndexTagValue :ApiSession.PowerboxTag = (
  canonicalUrl = "https://sot-images.sweetvinesystems.com",
  # We're requesting an API which will serve images specifically for the game Secrets of Toanium
);

const sourceIndexDescriptor :Powerbox.PowerboxDescriptor = (
  # Our descriptor has one tag, whose ID is `ApiSession`'s type ID, and
  # whose value is the tag value defined above.
  tags = [
    (id = 0xc879e379c625cdc7, value = .sourceIndexTagValue)
  ],
);