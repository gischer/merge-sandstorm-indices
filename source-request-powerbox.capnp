# sot-images-powerbox.capnp

@0xb753a7375769b9a1;

using Powerbox = import "/sandstorm/powerbox.capnp";
using ApiSession = import "/sandstorm/api-session.capnp".ApiSession;

# Tag value

const sourceIndexTagValue :ApiSession.PowerboxTag = (
  canonicalUrl = "https://app-index.sandstorm.io",
  # We're requesting an API which will serve images specifically for the game Secrets of Toanium
);

const sourceIndexDescriptor :Powerbox.PowerboxDescriptor = (
  # Our descriptor has one tag, whose ID is `ApiSession`'s type ID, and
  # whose value is the tag value defined above.
  tags = [
    (id = 0xc879e379c625cdc7, value = .sourceIndexTagValue)
  ],
);