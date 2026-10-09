const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Instead of a complex regex, we can just replace the block.
  // The block looks like:
  /*
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchUnread();
  */
  // We need to move `let channel;` to the top of the effect, and move the return outside.

  content = content.replace("const fetchUnread = async () => {", "let channel;\n    const fetchUnread = async () => {");
  
  // Replace the inner return with just assigning the channel? No, `channel` is already assigned if we use `channel = supabase...` instead of `const channel =`.
  content = content.replace("const channel = supabase", "channel = supabase");
  content = content.replace("const channelName = `desktop_", "const channelName = `desktop_"); // Just in case
  
  // Remove the inner return
  content = content.replace(
    "      return () => {\n        supabase.removeChannel(channel);\n      };\n    };\n\n    fetchUnread();\n  },",
    "    };\n\n    fetchUnread();\n\n    return () => {\n      if (channel) supabase.removeChannel(channel);\n    };\n  },"
  );

  fs.writeFileSync(file, content);
}

fixFile('src/components/MobileBottomNav.js');
fixFile('src/components/NavbarClient.js');

console.log("Fixed cleanup scope");
